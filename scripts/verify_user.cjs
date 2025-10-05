/* Verify user creation by checking Supabase tables
 * Usage: node scripts/verify_user.cjs --email="user@domain.com"
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
  const flag = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(flag));
  if (arg) return arg.slice(flag.length);
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
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env'
      );
    }

    const email = getArg('email', 'ilan-tech@thrissur.local');

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log(`Looking for user with email: ${email}`);

    // Get user from auth
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200
    });
    
    if (authError) throw authError;
    
    const authUser = authUsers.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!authUser) {
      console.log('❌ User not found in auth table');
      return;
    }
    
    console.log('✅ Auth User found:', {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      metadata: authUser.user_metadata
    });

    // Get profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile found:', profile);
    }

    // Get role
    const { data: role, error: roleError } = await admin
      .from('app_roles')
      .select('*')
      .eq('user_id', authUser.id)
      .single();
    
    if (roleError) {
      console.log('❌ Role not found:', roleError.message);
    } else {
      console.log('✅ Role found:', role);
    }

    // Get locations
    const { data: locations, error: locError } = await admin
      .from('user_locations')
      .select(`
        location_id,
        locations(id, name, code)
      `)
      .eq('user_id', authUser.id);
    
    if (locError) {
      console.log('❌ Locations error:', locError.message);
    } else if (!locations || locations.length === 0) {
      console.log('⚠️  No locations assigned');
    } else {
      console.log('✅ Locations found:', locations);
    }

    console.log('\n🎉 User verification complete!');
    
  } catch (e) {
    console.error('verify_user error:', e);
    process.exit(1);
  }
})();
