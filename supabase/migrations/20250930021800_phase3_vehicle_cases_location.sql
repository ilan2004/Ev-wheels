-- Phase 3: Add location_id to vehicle_cases and update RLS policies
-- This completes location support for all case types

-- Add location_id column to vehicle_cases
alter table if exists public.vehicle_cases add column if not exists location_id uuid;
alter table if exists public.vehicle_cases add constraint vehicle_cases_location_fk foreign key (location_id) references public.locations(id) on delete set null;
create index if not exists idx_vehicle_cases_location on public.vehicle_cases(location_id);

-- Enable RLS if not already enabled
alter table if exists public.vehicle_cases enable row level security;

-- Add read policy for vehicle_cases based on location
do $$ begin
  if to_regclass('public.vehicle_cases') is not null then
    drop policy if exists vehicle_cases_select_by_location on public.vehicle_cases;
    create policy vehicle_cases_select_by_location
      on public.vehicle_cases for select
      using (
        location_id is null -- allow existing rows until backfilled
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = vehicle_cases.location_id
        )
      );
  end if;
end $$;

-- Notes:
-- - location_id is nullable to allow gradual rollout
-- - RLS policy filters reads to only show vehicle cases from user's assigned locations
-- - Write policies for vehicle_cases should be handled in phase5_write_rls migration
