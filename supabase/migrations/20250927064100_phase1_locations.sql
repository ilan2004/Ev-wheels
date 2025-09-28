-- Phase 1: Locations data model and initial read-only RLS scoping
-- Safe to run multiple times due to IF EXISTS / IF NOT EXISTS and guarded DO blocks

-- Prereqs for UUIDs
create extension if not exists pgcrypto;

-- 1) Core tables
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_locations (
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, location_id)
);

-- Helpful indexes
create index if not exists idx_user_locations_user on public.user_locations(user_id);
create index if not exists idx_user_locations_location on public.user_locations(location_id);

-- 2) Add location_id to scoped tables (nullable for now; will enforce NOT NULL later)
-- Customers
alter table if exists public.customers add column if not exists location_id uuid;
alter table if exists public.customers add constraint customers_location_fk foreign key (location_id) references public.locations(id) on delete set null;
create index if not exists idx_customers_location on public.customers(location_id);

-- Battery records
alter table if exists public.battery_records add column if not exists location_id uuid;
alter table if exists public.battery_records add constraint battery_records_location_fk foreign key (location_id) references public.locations(id) on delete set null;
create index if not exists idx_battery_records_location on public.battery_records(location_id);

-- Service tickets
alter table if exists public.service_tickets add column if not exists location_id uuid;
alter table if exists public.service_tickets add constraint service_tickets_location_fk foreign key (location_id) references public.locations(id) on delete set null;
create index if not exists idx_service_tickets_location on public.service_tickets(location_id);

-- Quotes (header-level)
alter table if exists public.quotes add column if not exists location_id uuid;
alter table if exists public.quotes add constraint quotes_location_fk foreign key (location_id) references public.locations(id) on delete set null;
create index if not exists idx_quotes_location on public.quotes(location_id);

-- Invoices (header-level)
alter table if exists public.invoices add column if not exists location_id uuid;
alter table if exists public.invoices add constraint invoices_location_fk foreign key (location_id) references public.locations(id) on delete set null;
create index if not exists idx_invoices_location on public.invoices(location_id);

-- (Optional) Payments - derive from invoice; keeping nullable and optional for now
alter table if exists public.payments add column if not exists location_id uuid;
alter table if exists public.payments add constraint payments_location_fk foreign key (location_id) references public.locations(id) on delete set null;
create index if not exists idx_payments_location on public.payments(location_id);

-- 3) Enable RLS and add READ policies (writes will be tightened in Phase 5)

-- locations: readable by all signed-in users; restrict writes later
alter table if exists public.locations enable row level security;
drop policy if exists locations_read_all on public.locations;
create policy locations_read_all on public.locations for select using (true);

-- user_locations: user reads only their own rows
alter table if exists public.user_locations enable row level security;
drop policy if exists user_locations_self_read on public.user_locations;
create policy user_locations_self_read on public.user_locations for select using (auth.uid() = user_id);

-- Helper DO block to attach read policy for a table if it exists
-- Grants read access only when the user has a membership for the row's location_id

-- customers
alter table if exists public.customers enable row level security;
do $$ begin
  if to_regclass('public.customers') is not null then
    drop policy if exists customers_select_by_location on public.customers;
    create policy customers_select_by_location
      on public.customers for select
      using (
        location_id is null -- allow existing rows until backfilled
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = customers.location_id
        )
      );
  end if;
end $$;

-- battery_records
alter table if exists public.battery_records enable row level security;
do $$ begin
  if to_regclass('public.battery_records') is not null then
    drop policy if exists battery_records_select_by_location on public.battery_records;
    create policy battery_records_select_by_location
      on public.battery_records for select
      using (
        location_id is null
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = battery_records.location_id
        )
      );
  end if;
end $$;

-- service_tickets
alter table if exists public.service_tickets enable row level security;
do $$ begin
  if to_regclass('public.service_tickets') is not null then
    drop policy if exists service_tickets_select_by_location on public.service_tickets;
    create policy service_tickets_select_by_location
      on public.service_tickets for select
      using (
        location_id is null
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = service_tickets.location_id
        )
      );
  end if;
end $$;

-- quotes
alter table if exists public.quotes enable row level security;
do $$ begin
  if to_regclass('public.quotes') is not null then
    drop policy if exists quotes_select_by_location on public.quotes;
    create policy quotes_select_by_location
      on public.quotes for select
      using (
        location_id is null
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = quotes.location_id
        )
      );
  end if;
end $$;

-- invoices
alter table if exists public.invoices enable row level security;
do $$ begin
  if to_regclass('public.invoices') is not null then
    drop policy if exists invoices_select_by_location on public.invoices;
    create policy invoices_select_by_location
      on public.invoices for select
      using (
        location_id is null
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = invoices.location_id
        )
      );
  end if;
end $$;

-- payments (optional; if linked to invoices, this is redundant but harmless)
alter table if exists public.payments enable row level security;
do $$ begin
  if to_regclass('public.payments') is not null then
    drop policy if exists payments_select_by_location on public.payments;
    create policy payments_select_by_location
      on public.payments for select
      using (
        location_id is null
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = payments.location_id
        )
      );
  end if;
end $$;

-- 4) Notes
-- - Columns are nullable to ease rollout/backfill; plan to set NOT NULL in later phases.
-- - Only READ policies are added here; WRITE policies will be introduced in Phase 5.
-- - Inventory is global and intentionally not included here; treat it separately in Phase 6.

