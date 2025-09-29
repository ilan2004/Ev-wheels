-- Simplify battery_records RLS to allow technicians to create battery records
-- This reduces the admin requirement while maintaining some security

-- Option 1: Allow any authenticated user to insert battery records
-- (Least restrictive - good for single-location shops)
DROP POLICY IF EXISTS battery_records_insert_by_location ON public.battery_records;
CREATE POLICY battery_records_insert_by_location
  ON public.battery_records FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Option 2: Allow admins, managers, and technicians (more structured)
-- Uncomment this instead if you prefer role-based approach
/*
DROP POLICY IF EXISTS battery_records_insert_by_location ON public.battery_records;
CREATE POLICY battery_records_insert_by_location
  ON public.battery_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role IN ('admin', 'manager', 'technician')
    )
    OR auth.uid() IS NOT NULL  -- fallback for users without roles
  );
*/

-- Also update the UPDATE policy to match
DROP POLICY IF EXISTS battery_records_update_by_location ON public.battery_records;
CREATE POLICY battery_records_update_by_location
  ON public.battery_records FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'battery_records' AND schemaname = 'public';
