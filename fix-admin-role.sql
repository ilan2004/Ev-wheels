-- Fix Admin User Role - Change ilan-admin to administrator
-- User ID: e46a6a94-8e46-484b-8f6b-c05e58ae1507

-- Update the profile role to administrator
UPDATE public.profiles 
SET role = 'administrator'
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid
   OR username = 'ilan-admin';

-- Also update in any app_roles table if it exists
UPDATE public.app_roles 
SET role = 'administrator'
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_roles' AND table_schema = 'public');

-- Verify the update
SELECT 'Role update verification:' as check_type,
       user_id, username, email, role 
FROM public.profiles 
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid 
   OR username = 'ilan-admin';

-- Check if there's an app_roles table and show its content for this user
SELECT 'App roles verification:' as check_type,
       user_id, role 
FROM public.app_roles 
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_roles' AND table_schema = 'public');

-- Show all possible role values in the system (to understand what roles are available)
SELECT DISTINCT 'Available roles:' as check_type, role 
FROM public.profiles 
WHERE role IS NOT NULL
UNION ALL
SELECT DISTINCT 'Available app_roles:' as check_type, role 
FROM public.app_roles 
WHERE role IS NOT NULL
   AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_roles' AND table_schema = 'public');

SELECT 'Admin role fix completed!' as status;
