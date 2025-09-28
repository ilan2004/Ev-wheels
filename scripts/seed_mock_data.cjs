/* Seed mock data into Supabase using the service role key from .env.
 * Populates: locations, users (admin/manager/technician), profiles, app_roles, user_locations,
 * customers, battery_records, service_tickets, quotes, invoices, payments, inventory_movements.
 *
 * Usage (PowerShell):
 *  # Ensure .env has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *  pnpm i
 *  node scripts/seed_mock_data.cjs
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
const { faker } = require('@faker-js/faker');

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

(async () => {
  try {
    if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // 1) Locations
    const locationCodes = ['DEFAULT','KOCHI','DWN'];
    const locationIds = {};
    for (const code of locationCodes) {
      const name = code === 'DWN' ? 'Downtown' : (code.charAt(0)+code.slice(1).toLowerCase());
      const { data: existing, error: selErr } = await admin.from('locations').select('id,code').eq('code', code).maybeSingle();
      if (selErr) throw selErr;
      if (existing) {
        locationIds[code] = existing.id;
      } else {
        const { data: inserted, error: insErr } = await admin.from('locations').insert({ name, code }).select('id').single();
        if (insErr) throw insErr;
        locationIds[code] = inserted.id;
      }
    }

    // 2) Users (auth) + profiles + app_roles + user_locations
    const users = [
      { email: 'admin@test.local', password: 'Admin12345!', username: 'admin', role: 'admin', loc: 'DEFAULT' },
      { email: 'manager@test.local', password: 'Manager12345!', username: 'manager', role: 'manager', loc: 'KOCHI' },
      { email: 'tech@test.local', password: 'Tech12345!', username: 'tech', role: 'technician', loc: 'DWN' },
    ];
    const userIdsByEmail = {};

    async function upsertUser(u) {
      let userId = null;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: u.email, password: u.password, email_confirm: true, user_metadata: { role: u.role }
      });
      if (createErr) {
        const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        if (listErr) throw listErr;
        const found = list.users.find((usr) => usr.email?.toLowerCase() === u.email.toLowerCase());
        if (!found) throw createErr;
        userId = found.id;
        await admin.auth.admin.updateUserById(userId, { user_metadata: { role: u.role } });
      } else {
        userId = created.user?.id || null;
      }
      if (!userId) throw new Error('userId not resolved');
      userIdsByEmail[u.email] = userId;

      // profile
      const { error: pErr } = await admin.from('profiles').upsert({ user_id: userId, username: u.username, email: u.email }, { onConflict: 'user_id' });
      if (pErr) throw pErr;
      // role
      const { error: rErr } = await admin.from('app_roles').upsert({ user_id: userId, role: u.role }, { onConflict: 'user_id' });
      if (rErr) throw rErr;
      // membership
      const locId = locationIds[u.loc];
      if (locId) {
        const { error: ulErr } = await admin.from('user_locations').upsert({ user_id: userId, location_id: locId }, { onConflict: 'user_id,location_id' });
        if (ulErr) throw ulErr;
      }
      return userId;
    }

    for (const u of users) await upsertUser(u);

    // 3) Customers per location
    async function seedCustomers(locCode, n=10) {
      const locId = locationIds[locCode];
      const rows = Array.from({ length: n }).map(() => ({
        name: faker.person.fullName(),
        contact: faker.phone.number(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
        location_id: locId
      }));
      const { data, error } = await admin.from('customers').insert(rows).select('id');
      if (error) throw error;
      return data.map((r) => r.id);
    }

    const custByLoc = {};
    for (const code of locationCodes) custByLoc[code] = await seedCustomers(code, 10);

    // 4) Battery records per location
    async function seedBatteries(locCode, customerIds, n=10) {
      const locId = locationIds[locCode];
      const adminId = userIdsByEmail['admin@test.local'];
      const rows = Array.from({ length: n }).map(() => ({
        serial_number: faker.string.alphanumeric(10).toUpperCase(),
        brand: faker.company.name(),
        model: faker.string.alphanumeric(5).toUpperCase(),
        battery_type: faker.helpers.arrayElement(['li-ion','lfp','nmc','other']),
        voltage: 48,
        capacity: 20,
        cell_type: '18650',
        customer_id: faker.helpers.arrayElement(customerIds),
        repair_notes: faker.lorem.sentence(),
        estimated_cost: 1000,
        status: faker.helpers.arrayElement(['received','diagnosed','in_progress','completed','delivered']),
        location_id: locId,
        created_by: adminId,
        updated_by: adminId
      }));
      const { data, error } = await admin.from('battery_records').insert(rows).select('id');
      if (error) console.warn('battery_records insert warn:', error.message);
      return (data||[]).map(r=>r.id);
    }

    const batByLoc = {};
    for (const code of locationCodes) batByLoc[code] = await seedBatteries(code, custByLoc[code], 10);

    // 5) Service tickets per location
    async function seedTickets(locCode, customerIds, n=8) {
      const locId = locationIds[locCode];
      const adminId = userIdsByEmail['admin@test.local'];
      const rows = Array.from({ length: n }).map(() => ({
        ticket_number: `T-${faker.number.int({min:10000,max:99999})}`,
        customer_id: faker.helpers.arrayElement(customerIds),
        symptom: faker.lorem.sentence(),
        description: faker.lorem.sentences(2),
        vehicle_make: faker.vehicle.manufacturer(),
        vehicle_model: faker.vehicle.model(),
        vehicle_reg_no: faker.string.alphanumeric(8).toUpperCase(),
        status: faker.helpers.arrayElement(['reported','triaged','assigned','in_progress','completed','delivered','closed']),
        location_id: locId,
        created_by: adminId,
        updated_by: adminId
      }));
      const { data, error } = await admin.from('service_tickets').insert(rows).select('id');
      if (error) console.warn('service_tickets insert warn:', error.message);
      return (data||[]).map(r=>r.id);
    }

    const ticketsByLoc = {};
    for (const code of locationCodes) ticketsByLoc[code] = await seedTickets(code, custByLoc[code], 8);

    // 6) Vehicle cases per location (linked to some tickets)
    async function seedVehicleCases(locCode, ticketIds, customerIds, n=5) {
      const locId = locationIds[locCode];
      const adminId = userIdsByEmail['admin@test.local'];
      // fetch some ticket rows to get ids
      const { data: tkRows } = await admin.from('service_tickets').select('id').in('id', ticketIds.slice(0, n));
      const rows = (tkRows || []).map((t) => ({
        service_ticket_id: t.id,
        vehicle_make: faker.vehicle.manufacturer(),
        vehicle_model: faker.vehicle.model(),
        vehicle_reg_no: faker.string.alphanumeric(8).toUpperCase(),
        vehicle_year: faker.number.int({ min: 2005, max: 2025 }),
        vin_number: faker.string.alphanumeric(17).toUpperCase(),
        customer_id: faker.helpers.arrayElement(customerIds),
        status: faker.helpers.arrayElement(['received','diagnosed','in_progress','completed','delivered']),
        created_by: adminId,
        updated_by: adminId
      }));
      if (rows.length) {
        const { error } = await admin.from('vehicle_cases').insert(rows);
        if (error) console.warn('vehicle_cases insert warn:', error.message);
      }
    }

    for (const code of locationCodes) await seedVehicleCases(code, ticketsByLoc[code] || [], custByLoc[code] || [], 5);

    // 7) Quotes & Invoices per location (lightweight schema assumptions)
    function totalsMock(){return { itemsSubtotal: 1000, taxAmount: 180, shippingAmount: 0, adjustmentAmount: 0, grandTotal: 1180 };}

    async function seedQuotes(locCode, customerIds, n=4){
      const locId = locationIds[locCode];
      const rows = Array.from({length:n}).map(()=>({
        number: `Q-${faker.number.int({min:1000,max:9999})}`,
        status: 'draft',
        customer: { name: faker.person.fullName() },
        totals: totalsMock(),
        currency: 'INR',
        notes: null,
        terms: null,
        valid_until: new Date(Date.now()+7*86400000).toISOString(),
        created_by: 'seed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        location_id: locId,
      }));
      const { data, error } = await admin.from('quotes').insert(rows).select('id');
      if (error) console.warn('quotes insert warn:', error.message);
      return (data||[]).map(r=>r.id);
    }

    async function seedInvoices(locCode, customerIds, n=4){
      const locId = locationIds[locCode];
      const rows = Array.from({length:n}).map(()=>({
        number: `INV-${faker.number.int({min:1000,max:9999})}`,
        status: faker.helpers.arrayElement(['draft','sent','paid']),
        customer: { name: faker.person.fullName() },
        totals: totalsMock(),
        currency: 'INR',
        balance_due: faker.number.int({min:0,max:1180}),
        due_date: new Date(Date.now()+14*86400000).toISOString(),
        notes: null,
        terms: null,
        created_by: 'seed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        location_id: locId,
      }));
      const { data, error } = await admin.from('invoices').insert(rows).select('id, balance_due');
      if (error) console.warn('invoices insert warn:', error.message);
      return (data||[]);
    }

    const quotesByLoc = {};
    const invoicesByLoc = {};
    for (const code of locationCodes) quotesByLoc[code] = await seedQuotes(code, custByLoc[code], 4);
    for (const code of locationCodes) invoicesByLoc[code] = await seedInvoices(code, custByLoc[code], 4);

    // 7) Payments for invoices with balance_due > 0
    for (const code of locationCodes) {
      for (const inv of invoicesByLoc[code] || []) {
        if ((inv.balance_due||0) > 0) {
          const pay = {
            invoice_id: inv.id,
            amount: Math.min(inv.balance_due, 500),
            method: 'cash',
            reference: null,
            notes: 'seed payment',
            received_at: new Date().toISOString(),
            created_by: 'seed',
            created_at: new Date().toISOString(),
            location_id: locationIds[code]
          };
          const { error } = await admin.from('payments').insert(pay);
          if (error) console.warn('payments insert warn:', error.message);
        }
      }
    }

    // 8) Inventory movements per location
    async function seedMovements(locCode, n=5) {
      const locId = locationIds[locCode];
      const adminId = userIdsByEmail['admin@test.local'];
      const rows = Array.from({ length: n }).map(() => ({
        item_sku: faker.string.alphanumeric(8).toUpperCase(),
        movement_type: faker.helpers.arrayElement(['issue','receive','transfer']),
        from_location_id: faker.helpers.arrayElement([locId, null]),
        to_location_id: faker.helpers.arrayElement([locId, null]),
        quantity: faker.number.int({ min: 1, max: 5 }),
        notes: 'seed',
        status: faker.helpers.arrayElement(['pending','approved']),
        created_by: adminId,
        created_at: new Date().toISOString(),
        approved_by: null,
        approved_at: null
      }));
      const { error } = await admin.from('inventory_movements').insert(rows);
      if (error) console.warn('inventory_movements insert warn:', error.message);
    }

    for (const code of locationCodes) await seedMovements(code, 5);

    console.log('Mock data seeded successfully.');
    process.exit(0);
  } catch (e) {
    console.error('seed_mock_data error:', e);
    process.exit(1);
  }
})();

