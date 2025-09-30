-- Phase 3: Seed missing locations (Kochi, Thrissur)
-- Idempotent inserts using ON CONFLICT on code

create extension if not exists pgcrypto;

insert into public.locations (id, name, code)
values (gen_random_uuid(), 'Kochi', 'KOCHI')
on conflict (code) do nothing;

insert into public.locations (id, name, code)
values (gen_random_uuid(), 'Thrissur', 'THRISSUR')
on conflict (code) do nothing;

