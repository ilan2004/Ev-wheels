#!/usr/bin/env node
/*
  Danger: destructive reset script.
  This script deletes app data, preserving only:
  - manager user with username/email: 'ilan' / 'ilan@kochi.local' (keeps profile, role, and mapping)
  - location 'Kochi' (code 'KOCHI')

  Requirements:
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY (service role)

  Usage:
  node scripts/reset_data_keep_ilan_kochi.cjs --confirm

  Optional flags:
  --dry-run  Only print what would be deleted
*/

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CONFIRM = args.includes('--confirm');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

if (!CONFIRM) {
  console.error('Refusing to run without --confirm. Add --dry-run to preview.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { db: { schema: 'public' } });

async function withLog(label, fn) {
  process.stdout.write(label + ' ... ');
  try {
    const res = await fn();
    console.log('OK');
    return res;
  } catch (e) {
    console.log('ERROR');
    throw e;
  }
}

async function selectOne(table, filter) {
  const { data, error } = await supabase.from(table).select('*').match(filter).limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

async function deleteAll(table, where = {}) {
  if (DRY_RUN) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log(`DRY-RUN: would delete ~${count} rows from ${table}`);
    return { count };
  }
  let query = supabase.from(table).delete();
  // If no explicit filters are provided, apply a safe always-true filter on a ubiquitous column
  // Most tables in this script have an 'id' PK; use NOT id IS NULL to satisfy PostgREST filter requirement
  if (!where || Object.keys(where).length === 0) {
    query = query.not('id', 'is', null);
  }
  // apply filters if provided
  Object.entries(where).forEach(([k, v]) => {
    if (Array.isArray(v) && v.length === 2 && v[0] === 'neq') {
      query = query.neq(k, v[1]);
    } else if (Array.isArray(v) && v.length === 3 && v[0] === 'not') {
      // where: { composite: ['not', '(user_id,location_id)', '(uuid,uuid)'] }
      // not supported directly; fallback: none here
    } else {
      query = query.eq(k, v);
    }
  });
  const { error } = await query;
  if (error) throw error;
  return { ok: true };
}

async function run() {
  console.log('Reset starting. DRY_RUN:', DRY_RUN ? 'YES' : 'NO');

  // Locate manager ilan and location kochi
  const profile = await withLog('Fetch profile for username/email ilan', async () => {
    let p = await selectOne('profiles', { username: 'ilan' });
    if (!p) p = await selectOne('profiles', { email: 'ilan@kochi.local' });
    return p;
  });
  if (!profile) {
    console.warn('WARN: No profile found for ilan. Will preserve none.');
  }
  const ilanId = profile?.user_id || null;

  const kochi = await withLog("Fetch location 'KOCHI'", async () => {
    let l = await selectOne('locations', { code: 'KOCHI' });
    if (!l) l = await selectOne('locations', { name: 'Kochi' });
    return l;
  });
  if (!kochi) {
    console.warn('WARN: No location found with code KOCHI or name Kochi.');
  }
  const kochiId = kochi?.id || null;

  // Deletion order: children first
  const childTables = [
    'battery_status_history',
    'repair_estimates',
    'technical_diagnostics',
    'ticket_attachments',
    'vehicle_status_history',
    'service_ticket_history',
    'quote_items',
    'invoice_items',
    'payments',
    'customers_audit',
  ];

  const parentTables = [
    'vehicle_cases',
    'service_tickets',
    'invoices',
    'quotes',
    'battery_records',
    'customers',
    'inventory_movements',
  ];

  console.log('\nDeleting dependent/child tables');
  for (const t of childTables) {
    await withLog(`- ${t}`, () => deleteAll(t));
  }

  console.log('\nDeleting parent tables');
  for (const t of parentTables) {
    await withLog(`- ${t}`, () => deleteAll(t));
  }

  console.log('\nCleaning up auth-linked metadata (preserve ilan + kochi)');

  // user_locations: keep only (ilan, kochi)
  await withLog('- user_locations (preserving ilan@kochi only)', async () => {
    if (DRY_RUN) {
      console.log('DRY-RUN: would delete all rows except (user_id=ilanId, location_id=kochiId)');
      return { ok: true };
    }
    if (!ilanId || !kochiId) {
      // If we can't determine user or location, delete all mappings
      // user_locations has no 'id' column; use a safe always-true filter on created_at
      const { error } = await supabase.from('user_locations').delete().not('created_at', 'is', null);
      if (error) throw error;
      return { ok: true };
    }
    // Delete everything not equal to the exact pair
    const { error } = await supabase
      .from('user_locations')
      .delete()
      .or(`user_id.neq.${ilanId},location_id.neq.${kochiId}`);
    if (error) throw error;
    return { ok: true };
  });

  // app_roles: keep only ilan
  await withLog('- app_roles (preserving ilan only)', async () => {
    if (DRY_RUN) {
      console.log('DRY-RUN: would delete app_roles rows where user_id != ilan');
      return { ok: true };
    }
    if (ilanId) {
      const { error } = await supabase.from('app_roles').delete().neq('user_id', ilanId);
      if (error) throw error;
    } else {
      // Ensure a filter exists to satisfy PostgREST
      const { error } = await supabase.from('app_roles').delete().not('user_id', 'is', null);
      if (error) throw error;
    }
    return { ok: true };
  });

  // profiles: keep only ilan
  await withLog('- profiles (preserving ilan only)', async () => {
    if (DRY_RUN) {
      console.log('DRY-RUN: would delete profiles rows where user_id != ilan');
      return { ok: true };
    }
    if (ilanId) {
      const { error } = await supabase.from('profiles').delete().neq('user_id', ilanId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('profiles').delete().not('user_id', 'is', null);
      if (error) throw error;
    }
    return { ok: true };
  });

  // locations: keep only KOCHI
  await withLog("- locations (preserving 'KOCHI' only)", async () => {
    if (DRY_RUN) {
      console.log('DRY-RUN: would delete locations where code != KOCHI');
      return { ok: true };
    }
    if (kochiId) {
      const { error } = await supabase.from('locations').delete().neq('id', kochiId);
      if (error) throw error;
    } else {
      // If we can't identify kochi, do not delete locations to avoid locking ourselves out
      console.warn('WARN: Skipping locations cleanup because KOCHI not found.');
    }
    return { ok: true };
  });

  console.log('\n✅ Reset complete.');
}

run().catch((e) => {
  console.error('\n❌ Reset failed:', e.message);
  console.error(e);
  process.exit(1);
});

