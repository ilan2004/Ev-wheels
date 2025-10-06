const { createClient } = require('@supabase/supabase-js');

// Configuration - You'll need to set these
const SUPABASE_URL = 'https://sddolthuxysdqdrmvsxh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    
    // First, create the auth user
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email: 'ilan-admin@evwheels.com',
      password: 'ilan1234',
      email_confirm: true,
      user_metadata: {
        username: 'ilan-admin',
        role: 'administrator'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }

    console.log('✅ Auth user created:', user.user.id);

    // Create or ensure location exists
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .upsert({
        id: 'f7b5c2a0-1234-5678-9abc-123456789def',
        name: 'Main Branch',
        code: 'MAIN001',
        address: 'Head Office Location'
      })
      .select()
      .single();

    if (locationError) {
      console.error('❌ Error creating location:', locationError.message);
      return;
    }

    console.log('✅ Location created/updated');

    // Create the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.user.id,
        username: 'ilan-admin',
        email: 'ilan-admin@evwheels.com',
        first_name: 'Ilan',
        last_name: 'Administrator',
        role: 'administrator'
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      return;
    }

    console.log('✅ Profile created');

    // Assign user to location
    const { error: locationAssignError } = await supabase
      .from('user_locations')
      .upsert({
        user_id: user.user.id,
        location_id: 'f7b5c2a0-1234-5678-9abc-123456789def'
      });

    if (locationAssignError) {
      console.error('❌ Error assigning user to location:', locationAssignError.message);
      return;
    }

    console.log('✅ User assigned to location');
    console.log('\n🎉 Admin user created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Username: ilan-admin');
    console.log('Email: ilan-admin@evwheels.com');
    console.log('Password: ilan1234');
    console.log(`User ID: ${user.user.id}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createAdminUser();
