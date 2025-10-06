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

async function fixAppRoles() {
  try {
    console.log('🔧 Creating app_roles table and fixing admin role...');
    
    const userId = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507';
    
    // First, create the app_roles table if it doesn't exist
    console.log('📋 Creating app_roles table...');
    
    // Create app_roles table via SQL
    const { error: createTableError } = await supabase.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.app_roles (
          user_id UUID PRIMARY KEY,
          role TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        DROP POLICY IF EXISTS "app_roles_policy" ON public.app_roles;
        CREATE POLICY "app_roles_policy" ON public.app_roles FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (createTableError) {
      console.log('⚠️  Table creation error (might already exist):', createTableError.message);
    } else {
      console.log('✅ app_roles table created/verified');
    }
    
    // Now insert/update the admin role
    console.log('🔧 Inserting admin role into app_roles...');
    
    const { error: roleError } = await supabase
      .from('app_roles')
      .upsert({ 
        user_id: userId, 
        role: 'admin'  // Use 'admin' not 'administrator' to match UserRole.ADMIN
      }, { onConflict: 'user_id' });
    
    if (roleError) {
      console.error('❌ Error updating app_roles:', roleError.message);
      return;
    }
    
    console.log('✅ app_roles updated');
    
    // Also update user_metadata to ensure consistency
    console.log('🔧 Updating user_metadata...');
    
    const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        role: 'admin',  // Use 'admin' not 'administrator'
        username: 'ilan-admin'
      }
    });
    
    if (metadataError) {
      console.error('❌ Error updating user_metadata:', metadataError.message);
    } else {
      console.log('✅ user_metadata updated');
    }
    
    // Verify all role assignments
    console.log('\n🔍 Verifying role assignments...');
    
    // Check auth user metadata
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (!authError && authUser) {
      console.log(`📋 Auth user_metadata role: ${authUser.user.user_metadata?.role}`);
    }
    
    // Check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (!profileError && profile) {
      console.log(`📋 Profiles table role: ${profile.role}`);
    }
    
    // Check app_roles table
    const { data: appRole, error: appRoleError } = await supabase
      .from('app_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (!appRoleError && appRole) {
      console.log(`📋 App_roles table role: ${appRole.role}`);
    }
    
    console.log('\n🎉 Role fix completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Username: ilan-admin');
    console.log('Email: ilan-admin@evwheels.com');
    console.log('Password: ilan1234');
    console.log('\n🔥 User should now have ADMIN access!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixAppRoles();
