-- Migration: Rename 'manager' role to 'front_desk_manager'
-- Date: 2025-09-30
-- Purpose: Clarify role naming and align with actual responsibilities

-- Step 1: Update app_roles table (if it exists)
UPDATE app_roles 
SET role = 'front_desk_manager' 
WHERE role = 'manager';

-- Step 2: Update user_profiles table (if role column exists there)
UPDATE user_profiles 
SET role = 'front_desk_manager' 
WHERE role = 'manager';

-- Step 3: Update auth.users metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"front_desk_manager"'::jsonb
) 
WHERE raw_user_meta_data->>'role' = 'manager';

-- Step 4: If there's a role enum constraint, add the new value
-- (Uncomment and modify based on your actual enum name if it exists)
-- ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'front_desk_manager';

-- Step 5: Verify the migration
DO $$
DECLARE
  manager_count INTEGER;
  front_desk_count INTEGER;
BEGIN
  -- Count remaining 'manager' roles in app_roles
  SELECT COUNT(*) INTO manager_count 
  FROM app_roles 
  WHERE role = 'manager';
  
  -- Count new 'front_desk_manager' roles
  SELECT COUNT(*) INTO front_desk_count 
  FROM app_roles 
  WHERE role = 'front_desk_manager';
  
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Remaining manager roles: %', manager_count;
  RAISE NOTICE '  Front desk manager roles: %', front_desk_count;
  
  IF manager_count > 0 THEN
    RAISE WARNING 'There are still % manager roles that were not migrated', manager_count;
  END IF;
END $$;

-- Step 6: Add comment for documentation
COMMENT ON TABLE app_roles IS 'User roles: admin, front_desk_manager (formerly manager), technician';
