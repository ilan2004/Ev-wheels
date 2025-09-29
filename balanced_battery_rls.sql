-- Balanced RLS policy: Allow authenticated users to create battery records 
-- while keeping location-based system for data organization and future scaling

-- Update INSERT policy for battery_records
-- Allow authenticated users to insert, but still use location scoping for organization
DROP POLICY IF EXISTS battery_records_insert_by_location ON public.battery_records;
CREATE POLICY battery_records_insert_by_location
  ON public.battery_records FOR INSERT
  WITH CHECK (
    -- Allow if user is authenticated (removes admin requirement)
    auth.uid() IS NOT NULL
    -- The location_id will still be set by the withLocationId() function
    -- This maintains data organization without blocking operations
  );

-- Update UPDATE policy to match
DROP POLICY IF EXISTS battery_records_update_by_location ON public.battery_records;
CREATE POLICY battery_records_update_by_location
  ON public.battery_records FOR UPDATE
  USING (
    -- Allow authenticated users to update records
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    -- Allow authenticated users to update records
    auth.uid() IS NOT NULL
  );

-- Keep the SELECT policy location-based for data filtering
-- This ensures users still see location-appropriate data
DROP POLICY IF EXISTS battery_records_select_by_location ON public.battery_records;
CREATE POLICY battery_records_select_by_location
  ON public.battery_records FOR SELECT
  USING (
    -- Admins can see everything
    EXISTS (SELECT 1 FROM public.app_roles ar WHERE ar.user_id = auth.uid() AND ar.role = 'admin')
    OR
    -- Regular users see records from their assigned locations
    EXISTS (
      SELECT 1 FROM public.user_locations ul
      WHERE ul.user_id = auth.uid() AND ul.location_id = battery_records.location_id
    )
    OR
    -- Fallback: if no location assignments exist, show all (for single-location setups)
    NOT EXISTS (SELECT 1 FROM public.user_locations WHERE user_id = auth.uid())
  );

-- Also update DELETE policy for completeness
DROP POLICY IF EXISTS battery_records_delete_by_location ON public.battery_records;
CREATE POLICY battery_records_delete_by_location
  ON public.battery_records FOR DELETE
  USING (
    -- Only admins and managers can delete battery records
    EXISTS (
      SELECT 1 FROM public.app_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role IN ('admin', 'manager')
    )
  );

-- Display current policies to verify
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd as operation,
  qual as using_condition,
  with_check as check_condition
FROM pg_policies 
WHERE tablename = 'battery_records' AND schemaname = 'public'
ORDER BY cmd, policyname;
