-- Phase 5 (cont): Backfill app_roles from auth.users metadata and add secure RPC for username->email lookup

-- 1) Backfill app_roles using auth.users.raw_user_meta_data->>'role'
-- Fallback default role: 'technician'
insert into public.app_roles (user_id, role)
select u.id as user_id,
       case when (u.raw_user_meta_data->>'role') in ('admin','manager','technician')
            then (u.raw_user_meta_data->>'role')
            else 'technician'
       end as role
from auth.users u
on conflict (user_id) do update set role = excluded.role;

-- 2) Secure RPC: get_email_by_username
-- Returns email for a given username from public.profiles
-- Grant execute to anon and authenticated roles (safe minimal output)
create or replace function public.get_email_by_username(p_username text)
returns text
language sql
stable
as $$
  select email from public.profiles where username = p_username limit 1;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon;
grant execute on function public.get_email_by_username(text) to authenticated;
