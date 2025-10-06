-- Phase 2 (seed): default locations, profiles backfill, and default user->location membership
-- Intended for development/testing to quickly enable end-to-end flows.
-- Safe operations with ON CONFLICT/EXISTS guards.

create extension if not exists pgcrypto;

-- 1) Seed default locations
insert into public.locations (id, name, code)
values (gen_random_uuid(), 'Default', 'DEFAULT')
on conflict (code) do nothing;

insert into public.locations (id, name, code)
values (gen_random_uuid(), 'Downtown', 'DWN')
on conflict (code) do nothing;

insert into public.locations (id, name, code)
values (gen_random_uuid(), 'Uptown', 'UPT')
on conflict (code) do nothing;

-- 2) Backfill profiles for all auth users that don't have one yet
-- username defaults to local-part of email, sanitized to [a-z0-9_]
with new_profiles as (
  select 
    u.id as user_id,
    regexp_replace(lower(split_part(u.email, '@', 1)), '[^a-z0-9_]+', '', 'g') as username,
    u.email,
    null::text as first_name,
    null::text as last_name
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where p.user_id is null
    and u.email is not null
)
insert into public.profiles (user_id, username, email, first_name, last_name)
select user_id,
       case when coalesce(username, '') = '' then substring(encode(digest(user_id::text, 'sha256'), 'hex') for 16) else username end,
       email,
       first_name,
       last_name
from new_profiles;

-- 3) Assign all users to DEFAULT location if they have no membership yet
with def as (
  select id from public.locations where code = 'DEFAULT' limit 1
),
users_without_membership as (
  select u.id as user_id
  from auth.users u
  left join public.user_locations ul on ul.user_id = u.id
  group by u.id
  having count(ul.location_id) = 0
)
insert into public.user_locations (user_id, location_id)
select uwm.user_id, d.id
from users_without_membership uwm
cross join def d
on conflict do nothing;

