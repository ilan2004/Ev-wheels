-- Setup proper location-based permissions instead of requiring admin role

-- Step 1: Check current locations
SELECT 'Current locations:' as info;
SELECT id, name, code FROM public.locations ORDER BY name;

-- Step 2: Check your user ID
SELECT 'Your user ID:' as info;
SELECT auth.uid() as your_user_id;

-- Step 3: If no locations exist, create a default one
INSERT INTO public.locations (name, code, address) 
VALUES ('Main Workshop', 'MAIN', 'Your workshop address')
ON CONFLICT DO NOTHING;

-- Step 4: Get the location ID we just created (or existing one)
SELECT 'Available location for assignment:' as info;
SELECT id, name FROM public.locations WHERE code = 'MAIN' OR name ILIKE '%main%' LIMIT 1;

-- Step 5: Grant your user access to this location
-- Replace 'LOCATION_ID_HERE' with the actual ID from step 4
-- INSERT INTO public.user_locations (user_id, location_id) 
-- VALUES (auth.uid(), 'LOCATION_ID_HERE')
-- ON CONFLICT (user_id, location_id) DO NOTHING;

-- Step 6: Verify the assignment worked
SELECT 'Your location permissions:' as info;
SELECT ul.user_id, ul.location_id, l.name as location_name
FROM public.user_locations ul
JOIN public.locations l ON ul.location_id = l.id
WHERE ul.user_id = auth.uid();
