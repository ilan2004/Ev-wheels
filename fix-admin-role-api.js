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

async function fixAdminRole() {
  try {
    console.log('🔧 Fixing admin user role...');
    
    const userId = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507';
    
    // First, check current role
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching current profile:', fetchError.message);
      return;
    }
    
    console.log('📋 Current profile:', currentProfile);
    
    // Update the role to administrator
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'administrator' })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('❌ Error updating profile role:', updateError.message);
      return;
    }
    
    console.log('✅ Profile role updated to administrator');
    
    // Check if app_roles table exists and update it too
    const { data: appRoles, error: appRolesError } = await supabase
      .from('app_roles')
      .select('*')
      .eq('user_id', userId);
    
    if (!appRolesError && appRoles && appRoles.length > 0) {
      console.log('📋 Found app_roles entries:', appRoles);
      
      const { error: appRoleUpdateError } = await supabase
        .from('app_roles')
        .update({ role: 'administrator' })
        .eq('user_id', userId);
      
      if (appRoleUpdateError) {
        console.error('❌ Error updating app_roles:', appRoleUpdateError.message);
      } else {
        console.log('✅ App roles updated to administrator');
      }
    } else if (appRolesError && !appRolesError.message.includes('does not exist')) {
      console.log('⚠️  Note: app_roles table might not exist or no entries found');
    }
    
    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError.message);
      return;
    }
    
    console.log('\n🎉 Role fix completed successfully!');
    console.log('📋 Updated profile:');
    console.log(`   User ID: ${updatedProfile.user_id}`);
    console.log(`   Username: ${updatedProfile.username}`);
    console.log(`   Email: ${updatedProfile.email}`);
    console.log(`   Role: ${updatedProfile.role}`);
    console.log(`   First Name: ${updatedProfile.first_name}`);
    console.log(`   Last Name: ${updatedProfile.last_name}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixAdminRole();
