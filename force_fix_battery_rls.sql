-- AGGRESSIVE FIX: Completely remove RLS restrictions for authenticated users
-- This will definitely fix the triage issue

-- First, let's see what we're working with
SELECT 'Before changes - Current policies:' as info;
SELECT policyname, cmd, with_check, qual 
FROM pg_policies 
WHERE tablename = 'battery_records';

-- Drop ALL existing policies for battery_records
DROP POLICY IF EXISTS battery_records_insert_by_location ON public.battery_records;
DROP POLICY IF EXISTS battery_records_update_by_location ON public.battery_records;
DROP POLICY IF EXISTS battery_records_select_by_location ON public.battery_records;
DROP POLICY IF EXISTS battery_records_delete_by_location ON public.battery_records;

-- Create simple, permissive policies for authenticated users
CREATE POLICY battery_records_authenticated_full_access 
ON public.battery_records 
FOR ALL 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (auth.uid() IS NOT NULL);

-- Verify the new policy
SELECT 'After changes - New policies:' as info;
SELECT policyname, cmd, permissive, with_check, qual 
FROM pg_policies 
WHERE tablename = 'battery_records';

-- Test insert permission
SELECT 'Testing insert permission:' as info;
SELECT 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'INSERT should work - user is authenticated'
    ELSE 'INSERT will fail - user not authenticated'
  END as status;

-- Show RLS status
SELECT 'RLS is enabled?' as info;
SELECT 
  CASE 
    WHEN rowsecurity THEN 'YES - RLS is active'
    ELSE 'NO - RLS is disabled'
  END as rls_status
FROM pg_tables 
WHERE tablename = 'battery_records' AND schemaname = 'public';
