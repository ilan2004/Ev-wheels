/* Create or update a Supabase auth user, profile, location membership, and app role.
 * Reads service credentials from SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
 * User parameters can be provided via environment variables OR CLI args:
 *  NEW_USER_EMAIL, NEW_USER_PASSWORD, NEW_USER_USERNAME, NEW_USER_ROLE, NEW_USER_LOCATION_CODE
 * Example (PowerShell):
 *  $env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co";
 *  $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>";
 *  $env:NEW_USER_EMAIL="ilan@kochi.local";
 *  $env:NEW_USER_PASSWORD="Iluusman1234";
 *  $env:NEW_USER_USERNAME="ilan";
 *  $env:NEW_USER_ROLE="manager"; # or technician/admin
 *  $env:NEW_USER_LOCATION_CODE="KOCHI";
 *  node scripts/create_user.cjs
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const envCandidates = ['env.example.txt', '.env.local', '.env', '.env.example'];
for (const rel of envCandidates) {
  const p = path.resolve(process.cwd(), rel);
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}
const { createClient } = require('@supabase/supabase-js');

function getArg(name, def) {
  // Prefer explicit CLI flags over environment variables to allow one-off overrides
  const flag = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(flag));
  if (arg) return arg.slice(flag.length);
  const envName = `NEW_USER_${name.toUpperCase()}`;
  const envVal = process.env[envName];
  if (envVal) return envVal;
  return def;
}

(async () => {
  try {
    if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
    }

    const email = getArg('email');
    const password = getArg('password');
    const username = getArg('username', 'user');
    const role = getArg('role', 'technician');
    const locationCode = getArg('location_code', 'KOCHI');

    if (!email || !password) {
      throw new Error('Provide NEW_USER_EMAIL and NEW_USER_PASSWORD via env or CLI args');
    }

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1) Ensure location exists
    const { data: locRow, error: locErr } = await admin
      .from('locations')
      .select('id, code')
      .eq('code', locationCode)
      .maybeSingle();
    if (locErr) throw locErr;
    let locationId = locRow?.id || null;
    if (!locationId) {
      const { data: inserted, error: insLocErr } = await admin
        .from('locations')
        .insert({ name: locationCode, code: locationCode })
        .select('id')
        .single();
      if (insLocErr) throw insLocErr;
      locationId = inserted.id;
    }

    // 2) Create auth user (or fetch if exists)
    let userId = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });
    if (createErr) {
      // If user exists, try to find by listing (no direct get by email in v2)
      // Narrow search via filter
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) throw listErr;
      const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!found) throw createErr;
      userId = found.id;
      // Optionally update metadata role
      await admin.auth.admin.updateUserById(userId, { user_metadata: { role } });
    } else {
      userId = created.user?.id || null;
    }

    if (!userId) throw new Error('Failed to resolve user id');

    // 3) Upsert profile
    const { error: profErr } = await admin
      .from('profiles')
      .upsert({ user_id: userId, username, email }, { onConflict: 'user_id' });
    if (profErr) throw profErr;

    // 4) Ensure user_locations membership
    if (locationId) {
      const { error: ulErr } = await admin
        .from('user_locations')
        .upsert({ user_id: userId, location_id: locationId }, { onConflict: 'user_id,location_id' });
      if (ulErr) throw ulErr;
    }

    // 5) Upsert app_roles (RLS admin checks rely on this)
    const { error: roleErr } = await admin
      .from('app_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
    if (roleErr) throw roleErr;

    console.log('User ready:', { userId, email, username, role, locationCode });
    process.exit(0);
  } catch (e) {
    console.error('create_user error:', e);
    process.exit(1);
  }
})();

