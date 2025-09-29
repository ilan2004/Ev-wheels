-- Debug script to check current RLS policies and fix the battery_records issue

-- Step 1: Check current RLS policies on battery_records
SELECT 'Current RLS policies on battery_records:' as info;
SELECT 
  policyname as policy_name,
  cmd as operation,
  permissive,
  roles,
  qual as using_condition,
  with_check as check_condition
FROM pg_policies 
WHERE tablename = 'battery_records' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Step 2: Check if RLS is enabled
SELECT 'RLS status:' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'battery_records' AND schemaname = 'public';

-- Step 3: Check current user
SELECT 'Current user:' as info;
SELECT auth.uid() as current_user_id;

-- Step 4: Test the policy conditions manually
SELECT 'Testing policy conditions:' as info;
SELECT 
  'User authenticated?' as test,
  CASE WHEN auth.uid() IS NOT NULL THEN 'YES' ELSE 'NO' END as result
UNION ALL
SELECT 
  'User has admin role?',
  CASE WHEN EXISTS (SELECT 1 FROM public.app_roles WHERE user_id = auth.uid() AND role = 'admin') 
       THEN 'YES' ELSE 'NO' END
UNION ALL
SELECT 
  'User has any role?',
  CASE WHEN EXISTS (SELECT 1 FROM public.app_roles WHERE user_id = auth.uid()) 
       THEN 'YES' ELSE 'NO' END
UNION ALL
SELECT 
  'User has location assignment?',
  CASE WHEN EXISTS (SELECT 1 FROM public.user_locations WHERE user_id = auth.uid()) 
       THEN 'YES' ELSE 'NO' END;
