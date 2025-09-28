-- Fix existing null updated_by values in vehicle_cases
-- This should be run BEFORE the add-vehicle-thumbnails migration

-- First, check if there are any records with null updated_by
SELECT COUNT(*) as null_updated_by_count 
FROM vehicle_cases 
WHERE updated_by IS NULL;

-- Update all records with null updated_by to use created_by value
UPDATE vehicle_cases 
SET updated_by = created_by 
WHERE updated_by IS NULL AND created_by IS NOT NULL;

-- If there are still nulls (both created_by and updated_by are null), 
-- you'll need to set them to a valid user ID
-- Replace 'YOUR_ADMIN_USER_ID' with an actual admin user ID from your auth.users table
-- You can find this by running: SELECT id, email FROM auth.users LIMIT 5;

-- Uncomment and modify this if needed:
-- UPDATE vehicle_cases 
-- SET updated_by = 'YOUR_ADMIN_USER_ID',
--     created_by = 'YOUR_ADMIN_USER_ID'
-- WHERE updated_by IS NULL OR created_by IS NULL;

-- Verify all updated_by values are now not null
SELECT COUNT(*) as still_null_count 
FROM vehicle_cases 
WHERE updated_by IS NULL;
