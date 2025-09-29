-- Safe location setup script - checks table structure first
-- Run this AFTER running the balanced_battery_rls.sql script

-- Step 1: Check locations table structure
SELECT 'Locations table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'locations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Show current locations (using only columns we know exist)
SELECT 'Current locations in system:' as info;
SELECT id, name, code, created_at 
FROM public.locations 
ORDER BY created_at;

-- Step 3: Create default location if none exist (safe version)
INSERT INTO public.locations (name, code) 
SELECT 'Main Location', 'MAIN'
WHERE NOT EXISTS (SELECT 1 FROM public.locations);

-- Step 4: Show locations again after potential insert
SELECT 'Locations after setup:' as info;
SELECT id, name, code, created_at 
FROM public.locations 
ORDER BY created_at;

-- Step 5: Show current user info
SELECT 'Your user information:' as info;
SELECT 
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN 'Not authenticated'
        ELSE 'Authenticated'
    END as auth_status;

-- Step 6: Check if current user has location assignments
SELECT 'Your location assignments:' as info;
SELECT 
    COALESCE(ul.user_id::text, 'No assignments found') as user_id,
    COALESCE(ul.location_id::text, 'N/A') as location_id,
    COALESCE(l.name, 'N/A') as location_name,
    COALESCE(l.code, 'N/A') as location_code
FROM public.user_locations ul
FULL OUTER JOIN public.locations l ON ul.location_id = l.id
WHERE ul.user_id = auth.uid() OR ul.user_id IS NULL
LIMIT 1;

-- Step 7: Check user's role
SELECT 'Your role assignment:' as info;
SELECT 
    COALESCE(ar.user_id::text, 'No role assigned') as user_id,
    COALESCE(ar.role, 'N/A') as role,
    COALESCE(ar.created_at::text, 'N/A') as created_at
FROM public.app_roles ar
WHERE ar.user_id = auth.uid()
UNION ALL
SELECT 'No role found', 'N/A', 'N/A'
WHERE NOT EXISTS (SELECT 1 FROM public.app_roles WHERE user_id = auth.uid())
LIMIT 1;

-- Step 8: Show available location IDs for assignment
SELECT 'Available locations for assignment:' as info;
SELECT 
    'Location ID: ' || id || ' - Name: ' || name || ' - Code: ' || COALESCE(code, 'N/A') as assignment_info
FROM public.locations
ORDER BY created_at;

-- Step 9: Instructions
SELECT '=== INSTRUCTIONS ===' as info
UNION ALL
SELECT 'Your triage should now work with the updated RLS policy!' as info
UNION ALL
SELECT 'If you want location-based filtering, assign yourself to a location:' as info
UNION ALL
SELECT 'INSERT INTO user_locations (user_id, location_id) VALUES (auth.uid(), ''PASTE_LOCATION_ID_HERE'');' as info
UNION ALL
SELECT 'Replace PASTE_LOCATION_ID_HERE with an ID from the locations above.' as info;
