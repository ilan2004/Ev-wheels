-- EMERGENCY FIX: Temporarily disable RLS on battery_records table
-- This will immediately fix the triage issue

-- Check current RLS status
SELECT 'Current RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'battery_records';

-- Disable RLS entirely on battery_records table
ALTER TABLE public.battery_records DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 'RLS status after disabling:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'battery_records';

SELECT 'IMPORTANT: RLS is now DISABLED on battery_records table!' as warning;
SELECT 'All authenticated users can now read/write ALL battery records.' as warning;
SELECT 'You can re-enable RLS later with proper policies using:' as info;
SELECT 'ALTER TABLE public.battery_records ENABLE ROW LEVEL SECURITY;' as info;
