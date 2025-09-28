-- Seed new location 'Kochi' and conditionally map profile/user_locations for user email
create extension if not exists pgcrypto;

-- 1) Ensure Kochi location exists
insert into public.locations (id, name, code)
values (gen_random_uuid(), 'Kochi', 'KOCHI')
on conflict (code) do nothing;

-- 2) If an auth user with email exists, create profile/assignment
do $$
declare
  v_uid uuid;
  v_loc uuid;
begin
  select id into v_uid from auth.users where email = 'ilan@kochi.local' limit 1;
  select id into v_loc from public.locations where code = 'KOCHI' limit 1;

  if v_uid is not null and v_loc is not null then
    -- upsert profile
    insert into public.profiles (user_id, username, email)
    values (v_uid, 'ilan', 'ilan@kochi.local')
    on conflict (user_id) do update set username = excluded.username, email = excluded.email;

    -- ensure membership
    insert into public.user_locations (user_id, location_id)
    values (v_uid, v_loc)
    on conflict do nothing;
  end if;
end $$;
