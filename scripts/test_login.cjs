/* Test user login credentials
 * Usage: node scripts/test_login.cjs --email="user@domain.com" --password="password"
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in env');
    }

    const email = getArg('email', 'ilan-tech@thrissur.local');
    const password = getArg('password', 'ilan1234');

    const client = createClient(url, anonKey);

    console.log(`🔐 Testing login for: ${email}`);

    // Test login
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    console.log('✅ Login successful!');
    console.log('User ID:', authData.user?.id);
    console.log('Email:', authData.user?.email);
    console.log('Role:', authData.user?.user_metadata?.role);
    
    // Test getting user profile
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('username, email')
      .eq('user_id', authData.user?.id)
      .single();

    if (profileError) {
      console.log('⚠️  Could not fetch profile:', profileError.message);
    } else {
      console.log('✅ Profile accessible:', profile);
    }

    // Sign out
    await client.auth.signOut();
    console.log('🎉 Login test complete - credentials are working!');
    
  } catch (e) {
    console.error('❌ Test login error:', e.message);
    process.exit(1);
  }
})();
