-- Migration: Update app_roles role check to include 'front_desk_manager'
-- Reason: Creating users with role 'front_desk_manager' fails due to CHECK constraint
-- Date: 2025-09-30

DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find the existing check constraint name on app_roles.role
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE t.relname = 'app_roles'
    AND n.nspname = 'public'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%role in (%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.app_roles DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Add the updated constraint that includes the new role
  ALTER TABLE public.app_roles
    ADD CONSTRAINT app_roles_role_check
    CHECK (role IN ('admin','front_desk_manager','technician'));

  -- Backfill any lingering 'manager' values just in case
  UPDATE public.app_roles
    SET role = 'front_desk_manager'
    WHERE role = 'manager';
END $$;

-- Optional: ensure auth.users metadata also reflects the rename (safe no-op if already done)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"front_desk_manager"'::jsonb
) 
WHERE raw_user_meta_data->>'role' = 'manager';

