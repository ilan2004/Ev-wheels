// Test script to check if database schema exists and is properly set up
import { supabase } from '@/lib/supabase/client';

export async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');

    // Test 1: Check if customers table exists
    console.log('📋 Checking customers table...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);

    if (customersError) {
      console.error('❌ Customers table error:', customersError.message);
      return false;
    }

    console.log(
      '✅ Customers table exists:',
      customers?.length,
      'records found'
    );

    // Test 2: Check if battery_records table exists
    console.log('🔋 Checking battery_records table...');
    const { data: batteries, error: batteriesError } = await supabase
      .from('battery_records')
      .select('*')
      .limit(5);

    if (batteriesError) {
      console.error('❌ Battery_records table error:', batteriesError.message);
      return false;
    }

    console.log(
      '✅ Battery_records table exists:',
      batteries?.length,
      'records found'
    );

    // Test 3: Check if technical_diagnostics table exists
    console.log('🔬 Checking technical_diagnostics table...');
    const { data: diagnostics, error: diagnosticsError } = await supabase
      .from('technical_diagnostics')
      .select('*')
      .limit(5);

    if (diagnosticsError) {
      console.error(
        '❌ Technical_diagnostics table error:',
        diagnosticsError.message
      );
      return false;
    }

    console.log(
      '✅ Technical_diagnostics table exists:',
      diagnostics?.length,
      'records found'
    );

    // Test 4: Check if battery_status_history table exists
    console.log('📈 Checking battery_status_history table...');
    const { data: history, error: historyError } = await supabase
      .from('battery_status_history')
      .select('*')
      .limit(5);

    if (historyError) {
      console.error(
        '❌ Battery_status_history table error:',
        historyError.message
      );
      return false;
    }

    console.log(
      '✅ Battery_status_history table exists:',
      history?.length,
      'records found'
    );

    console.log('🎉 All database tables are properly set up!');
    return true;
  } catch (error) {
    console.error('💥 Database connection test failed:', error);
    return false;
  }
}

// Export a simple function to get the first battery for testing
export async function getTestBattery() {
  try {
    const { data: battery, error } = await supabase
      .from('battery_records')
      .select(
        `
        *,
        customer:customers(*)
      `
      )
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching test battery:', error);
      return null;
    }

    return battery;
  } catch (error) {
    console.error('Error in getTestBattery:', error);
    return null;
  }
}
