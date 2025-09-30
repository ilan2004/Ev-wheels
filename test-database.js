// Simple test script to check what's in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sddolthuxysdqdrmvsxh.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Check if customers table has data
    console.log('\n📋 Checking customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, contact')
      .limit(5);

    if (customersError) {
      console.error('❌ Customers table error:', customersError.message);
      console.error('Full error:', customersError);
    } else {
      console.log('✅ Customers found:', customers?.length || 0);
      customers?.forEach((customer) => {
        console.log(
          `  - ${customer.id} | ${customer.name} | ${customer.contact}`
        );
      });
    }

    // Test 2: Check if battery_records table has data
    console.log('\n🔋 Checking battery_records table...');
    const { data: batteries, error: batteriesError } = await supabase
      .from('battery_records')
      .select('id, serial_number, brand, status')
      .limit(5);

    if (batteriesError) {
      console.error('❌ Battery_records table error:', batteriesError.message);
      console.error('Full error:', batteriesError);
    } else {
      console.log('✅ Batteries found:', batteries?.length || 0);
      batteries?.forEach((battery) => {
        console.log(
          `  - ${battery.id} | ${battery.serial_number} | ${battery.brand} | ${battery.status}`
        );
      });

      // If we found batteries, try to fetch the first one with joined data
      if (batteries && batteries.length > 0) {
        const firstBatteryId = batteries[0].id;
        console.log(
          `\n🎯 Testing detailed fetch for battery: ${firstBatteryId}`
        );

        const { data: detailedBattery, error: detailError } = await supabase
          .from('battery_records')
          .select(
            `
            *,
            customer:customers(*)
          `
          )
          .eq('id', firstBatteryId)
          .single();

        if (detailError) {
          console.error(
            '❌ Detailed battery fetch error:',
            detailError.message
          );
        } else {
          console.log('✅ Detailed battery fetch successful');
          console.log(
            '   Customer:',
            detailedBattery.customer?.name || 'Not found'
          );
        }
      }
    }

    // Test 3: Check if tables are empty or have issues
    if (!customers?.length && !batteries?.length) {
      console.log('\n⚠️ No data found in tables. Checking if tables exist...');

      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['customers', 'battery_records']);

      if (tablesError) {
        console.error('Could not check table existence:', tablesError.message);
      } else {
        console.log(
          'Tables that exist:',
          tablesData?.map((t) => t.table_name) || []
        );
      }
    }
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDatabase();
