-- Phase 5: Write RLS for location-scoped tables and restrict Inventory writes to Admin
-- This migration assumes Phase 1/2 have been applied.
-- Admin check via app_roles table: user_id -> role. Populate this table to grant admin privileges.

create table if not exists public.app_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','manager','technician')),
  created_at timestamptz not null default now()
);

alter table if exists public.app_roles enable row level security;
-- Allow users to read their own role row; admins can read all (simplified: allow all select)
drop policy if exists app_roles_read_all on public.app_roles;
create policy app_roles_read_all on public.app_roles for select using (true);
-- Only admins should modify roles (manage via dashboard ideally). For now, block updates by default.
drop policy if exists app_roles_noupdate on public.app_roles;
create policy app_roles_noupdate on public.app_roles for update using (false) with check (false);

-- Helper predicate for admin inlined in policies:
-- EXISTS (SELECT 1 FROM public.app_roles ar WHERE ar.user_id = auth.uid() AND ar.role = 'admin')

-- Customers write policies
do $$ begin
  if to_regclass('public.customers') is not null then
    -- INSERT
    drop policy if exists customers_insert_by_location on public.customers;
    create policy customers_insert_by_location
      on public.customers for insert
      with check (
        exists (
          select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'
        )
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = customers.location_id
        )
      );

    -- UPDATE
    drop policy if exists customers_update_by_location on public.customers;
    create policy customers_update_by_location
      on public.customers for update
      using (
        exists (
          select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'
        )
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = customers.location_id
        )
      )
      with check (
        exists (
          select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'
        )
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = customers.location_id
        )
      );

    -- DELETE
    drop policy if exists customers_delete_by_location on public.customers;
    create policy customers_delete_by_location
      on public.customers for delete
      using (
        exists (
          select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'
        )
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid()
            and ul.location_id = customers.location_id
        )
      );
  end if;
end $$;

-- Battery records write policies
do $$ begin
  if to_regclass('public.battery_records') is not null then
    drop policy if exists battery_records_insert_by_location on public.battery_records;
    create policy battery_records_insert_by_location
      on public.battery_records for insert
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid() and ul.location_id = battery_records.location_id
        )
      );

    drop policy if exists battery_records_update_by_location on public.battery_records;
    create policy battery_records_update_by_location
      on public.battery_records for update
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid() and ul.location_id = battery_records.location_id
        )
      )
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid() and ul.location_id = battery_records.location_id
        )
      );

    drop policy if exists battery_records_delete_by_location on public.battery_records;
    create policy battery_records_delete_by_location
      on public.battery_records for delete
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul
          where ul.user_id = auth.uid() and ul.location_id = battery_records.location_id
        )
      );
  end if;
end $$;

-- Service tickets write policies
do $$ begin
  if to_regclass('public.service_tickets') is not null then
    drop policy if exists service_tickets_insert_by_location on public.service_tickets;
    create policy service_tickets_insert_by_location
      on public.service_tickets for insert
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = service_tickets.location_id
        )
      );

    drop policy if exists service_tickets_update_by_location on public.service_tickets;
    create policy service_tickets_update_by_location
      on public.service_tickets for update
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = service_tickets.location_id
        )
      )
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = service_tickets.location_id
        )
      );

    drop policy if exists service_tickets_delete_by_location on public.service_tickets;
    create policy service_tickets_delete_by_location
      on public.service_tickets for delete
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = service_tickets.location_id
        )
      );
  end if;
end $$;

-- Quotes write policies
do $$ begin
  if to_regclass('public.quotes') is not null then
    drop policy if exists quotes_insert_by_location on public.quotes;
    create policy quotes_insert_by_location
      on public.quotes for insert
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = quotes.location_id
        )
      );

    drop policy if exists quotes_update_by_location on public.quotes;
    create policy quotes_update_by_location
      on public.quotes for update
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = quotes.location_id
        )
      )
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = quotes.location_id
        )
      );

    drop policy if exists quotes_delete_by_location on public.quotes;
    create policy quotes_delete_by_location
      on public.quotes for delete
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = quotes.location_id
        )
      );
  end if;
end $$;

-- Invoices write policies
do $$ begin
  if to_regclass('public.invoices') is not null then
    drop policy if exists invoices_insert_by_location on public.invoices;
    create policy invoices_insert_by_location
      on public.invoices for insert
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = invoices.location_id
        )
      );

    drop policy if exists invoices_update_by_location on public.invoices;
    create policy invoices_update_by_location
      on public.invoices for update
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = invoices.location_id
        )
      )
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = invoices.location_id
        )
      );

    drop policy if exists invoices_delete_by_location on public.invoices;
    create policy invoices_delete_by_location
      on public.invoices for delete
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = invoices.location_id
        )
      );
  end if;
end $$;

-- Payments write policies (optional; often derived from invoices)
do $$ begin
  if to_regclass('public.payments') is not null then
    drop policy if exists payments_insert_by_location on public.payments;
    create policy payments_insert_by_location
      on public.payments for insert
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = payments.location_id
        )
      );

    drop policy if exists payments_update_by_location on public.payments;
    create policy payments_update_by_location
      on public.payments for update
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = payments.location_id
        )
      )
      with check (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = payments.location_id
        )
      );

    drop policy if exists payments_delete_by_location on public.payments;
    create policy payments_delete_by_location
      on public.payments for delete
      using (
        exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin')
        or exists (
          select 1 from public.user_locations ul where ul.user_id = auth.uid() and ul.location_id = payments.location_id
        )
      );
  end if;
end $$;

-- Inventory (global): restrict writes to admins only; reads already open via earlier migration
-- Note: inventory table name assumed to be public.inventory
alter table if exists public.inventory enable row level security;

do $$ begin
  if to_regclass('public.inventory') is not null then
    drop policy if exists inventory_write_admin_only on public.inventory;
    create policy inventory_write_admin_only
      on public.inventory for all
      using (exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'))
      with check (exists (select 1 from public.app_roles ar where ar.user_id = auth.uid() and ar.role = 'admin'));
  end if;
end $$;

