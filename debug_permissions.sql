-- Debug script for user permissions and location setup
-- Run this in your Supabase SQL editor to understand the permission issues

-- 1. Check current user ID
SELECT auth.uid() AS current_user_id;

-- 2. Check if user has any role in app_roles
SELECT * FROM public.app_roles WHERE user_id = auth.uid();

-- 3. Check available locations
SELECT * FROM public.locations ORDER BY name;

-- 4. Check user's location permissions
SELECT ul.*, l.name as location_name 
FROM public.user_locations ul
JOIN public.locations l ON ul.location_id = l.id
WHERE ul.user_id = auth.uid();

-- 5. Check if battery_records table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'battery_records' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Test what would happen if we tried to insert a battery record
-- (This will show the exact error without actually inserting)
EXPLAIN (FORMAT JSON) 
INSERT INTO public.battery_records 
(serial_number, brand, battery_type, voltage, capacity, cell_type, customer_id, repair_notes, location_id)
VALUES ('TEST-001', 'Test', 'other', 0, 0, 'prismatic', 'test-customer-id', 'test', 'test-location-id');
