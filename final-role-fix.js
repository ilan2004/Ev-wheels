const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://sddolthuxysdqdrmvsxh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function finalRoleFix() {
  try {
    console.log('🔧 Final role fix - updating user_metadata...');
    
    const userId = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507';
    
    // Update user_metadata with the correct role value
    console.log('📝 Updating user_metadata to use "admin" role...');
    
    const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: 'admin',  // This is the key - must match UserRole.ADMIN = 'admin'
        username: 'ilan-admin',
        firstName: 'Ilan',
        lastName: 'Administrator'
      }
    });
    
    if (metadataError) {
      console.error('❌ Error updating user_metadata:', metadataError.message);
      return;
    }
    
    console.log('✅ user_metadata updated');
    
    // Verify the update by fetching the user
    console.log('\n🔍 Verifying user_metadata...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError) {
      console.error('❌ Error fetching user:', authError.message);
      return;
    }
    
    console.log('📋 User metadata:', JSON.stringify(authUser.user.user_metadata, null, 2));
    
    // Also verify database entries
    console.log('\n🔍 Verifying database entries...');
    
    // Check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('user_id', userId)
      .single();
    
    if (profile) {
      console.log(`📋 Profiles table - username: ${profile.username}, role: ${profile.role}`);
    }
    
    // Check app_roles table
    const { data: appRole } = await supabase
      .from('app_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (appRole) {
      console.log(`📋 App_roles table - role: ${appRole.role}`);
    }
    
    console.log('\n🎉 Final role fix completed!');
    console.log('\n📝 Summary:');
    console.log('- user_metadata.role: ' + (authUser.user.user_metadata?.role || 'NOT SET'));
    console.log('- profiles.role: ' + (profile?.role || 'NOT SET'));
    console.log('- app_roles.role: ' + (appRole?.role || 'NOT SET'));
    
    console.log('\n🔥 All roles should now be "admin" which matches UserRole.ADMIN!');
    console.log('\n🚀 Try logging in again - you should see the ADMIN dashboard!');
    
    console.log('\n📝 Login Credentials:');
    console.log('Username: ilan-admin');
    console.log('Email: ilan-admin@evwheels.com');
    console.log('Password: ilan1234');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

finalRoleFix();
