-- Phase 6: Inventory Movements (global master, per-location movements)
-- Create inventory_movements to capture issue/receive/transfer requests tied to locations.

create extension if not exists pgcrypto;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid null, -- optional FK to your inventory items table if/when it exists
  item_sku text null,
  movement_type text not null check (movement_type in ('issue','receive','transfer','adjustment','request')),
  from_location_id uuid null references public.locations(id) on delete set null,
  to_location_id uuid null references public.locations(id) on delete set null,
  quantity numeric not null check (quantity > 0),
  notes text null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null
);

create index if not exists idx_inventory_movements_created_at on public.inventory_movements(created_at desc);
create index if not exists idx_inventory_movements_from_loc on public.inventory_movements(from_location_id);
create index if not exists idx_inventory_movements_to_loc on public.inventory_movements(to_location_id);

alter table if exists public.inventory_movements enable row level security;

-- Read: allow admin or membership in either from or to location; also allow read if both locations are null
 drop policy if exists inventory_movements_select on public.inventory_movements;
create policy inventory_movements_select
  on public.inventory_movements for select
  using (
    exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
    or (from_location_id is null and to_location_id is null)
    or exists (
      select 1 from public.user_locations ul
      where ul.user_id = auth.uid()
        and (ul.location_id = public.inventory_movements.from_location_id
             or ul.location_id = public.inventory_movements.to_location_id)
    )
  );

-- Insert: allow admin or membership in either from or to location
 drop policy if exists inventory_movements_insert on public.inventory_movements;
create policy inventory_movements_insert
  on public.inventory_movements for insert
  with check (
    exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
    or exists (
      select 1 from public.user_locations ul
      where ul.user_id = auth.uid()
        and (ul.location_id = public.inventory_movements.from_location_id
             or ul.location_id = public.inventory_movements.to_location_id)
    )
  );

-- Update/Delete: admin only (approval/rejection)
 drop policy if exists inventory_movements_update on public.inventory_movements;
create policy inventory_movements_update
  on public.inventory_movements for update
  using (exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'))
  with check (exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'));

 drop policy if exists inventory_movements_delete on public.inventory_movements;
create policy inventory_movements_delete
  on public.inventory_movements for delete
  using (exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'));

