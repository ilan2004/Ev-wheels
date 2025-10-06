-- Fix vehicle_cases RLS policies
-- Add missing INSERT, UPDATE, DELETE policies for vehicle_cases table

-- Enable RLS if not already enabled (should already be enabled from phase3)
ALTER TABLE IF EXISTS public.vehicle_cases ENABLE ROW LEVEL SECURITY;

-- Vehicle Cases write policies (following the same pattern as other tables in phase5)
DO $$ BEGIN
  IF to_regclass('public.vehicle_cases') IS NOT NULL THEN
    -- INSERT policy
    DROP POLICY IF EXISTS vehicle_cases_insert_by_location ON public.vehicle_cases;
    CREATE POLICY vehicle_cases_insert_by_location
      ON public.vehicle_cases FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.app_roles ar 
          WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
        )
        OR EXISTS (
          SELECT 1 FROM public.user_locations ul
          WHERE ul.user_id = auth.uid()
            AND ul.location_id = vehicle_cases.location_id
        )
        OR vehicle_cases.location_id IS NULL -- Allow gradual rollout
      );

    -- UPDATE policy
    DROP POLICY IF EXISTS vehicle_cases_update_by_location ON public.vehicle_cases;
    CREATE POLICY vehicle_cases_update_by_location
      ON public.vehicle_cases FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.app_roles ar 
          WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
        )
        OR EXISTS (
          SELECT 1 FROM public.user_locations ul
          WHERE ul.user_id = auth.uid()
            AND ul.location_id = vehicle_cases.location_id
        )
        OR vehicle_cases.location_id IS NULL -- Allow existing rows until backfilled
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.app_roles ar 
          WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
        )
        OR EXISTS (
          SELECT 1 FROM public.user_locations ul
          WHERE ul.user_id = auth.uid()
            AND ul.location_id = vehicle_cases.location_id
        )
        OR vehicle_cases.location_id IS NULL -- Allow gradual rollout
      );

    -- DELETE policy
    DROP POLICY IF EXISTS vehicle_cases_delete_by_location ON public.vehicle_cases;
    CREATE POLICY vehicle_cases_delete_by_location
      ON public.vehicle_cases FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.app_roles ar 
          WHERE ar.user_id = auth.uid() AND ar.role IN ('admin', 'manager')
        )
        OR EXISTS (
          SELECT 1 FROM public.user_locations ul
          WHERE ul.user_id = auth.uid()
            AND ul.location_id = vehicle_cases.location_id
        )
      );
  END IF;
END $$;

-- Display current policies for verification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd as operation,
  qual as using_condition,
  with_check as check_condition
FROM pg_policies 
WHERE tablename = 'vehicle_cases' AND schemaname = 'public'
ORDER BY cmd, policyname;
