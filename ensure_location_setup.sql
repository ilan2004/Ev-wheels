-- Ensure basic location setup exists for the location-based system
-- Run this AFTER running the balanced_battery_rls.sql script

-- Step 1: Check if we have any locations
DO $$
DECLARE
    location_count INTEGER;
    default_location_id UUID;
BEGIN
    -- Count existing locations
    SELECT COUNT(*) INTO location_count FROM public.locations;
    
    RAISE NOTICE 'Found % existing locations', location_count;
    
    -- If no locations exist, create a default one
    IF location_count = 0 THEN
        INSERT INTO public.locations (name, code) 
        VALUES ('Main Location', 'MAIN')
        RETURNING id INTO default_location_id;
        
        RAISE NOTICE 'Created default location with ID: %', default_location_id;
    END IF;
END
$$;

-- Step 2: Show current locations
SELECT 'Current locations in system:' as info;
SELECT id, name, code, created_at 
FROM public.locations 
ORDER BY created_at;

-- Step 3: Show current user info
SELECT 'Your user information:' as info;
SELECT 
    auth.uid() as user_id,
    CASE 
        WHEN auth.uid() IS NULL THEN 'Not authenticated'
        ELSE 'Authenticated'
    END as auth_status;

-- Step 4: Check if current user has location assignments
SELECT 'Your location assignments:' as info;
SELECT 
    ul.user_id,
    ul.location_id, 
    l.name as location_name,
    l.code as location_code
FROM public.user_locations ul
JOIN public.locations l ON ul.location_id = l.id
WHERE ul.user_id = auth.uid();

-- Step 5: Check user's role
SELECT 'Your role assignment:' as info;
SELECT 
    ar.user_id,
    ar.role,
    ar.created_at
FROM public.app_roles ar
WHERE ar.user_id = auth.uid();

-- Step 6: Instructions for next steps
SELECT '=== NEXT STEPS ===' as info
UNION ALL
SELECT 'If you have no location assignments above, you have two options:' as info
UNION ALL
SELECT '1. Add location assignment: INSERT INTO user_locations (user_id, location_id) VALUES (auth.uid(), ''LOCATION_ID_FROM_STEP_2'');' as info
UNION ALL
SELECT '2. The fallback policy will show all records if no assignments exist' as info
UNION ALL
SELECT 'If you want role-based access, add role: INSERT INTO app_roles (user_id, role) VALUES (auth.uid(), ''technician'');' as info;
