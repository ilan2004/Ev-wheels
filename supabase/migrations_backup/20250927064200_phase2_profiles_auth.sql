-- Phase 2: Profiles (username mapping) + RLS for public username->email lookup
-- Caution: Public SELECT on profiles exposes username/email mapping; suitable for dev/staging.
-- For production, consider replacing this with a secure RPC or CAPTCHA/ratelimiting.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text not null,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_email on public.profiles(email);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

-- RLS policies
alter table if exists public.profiles enable row level security;
-- Public lookup for username->email mapping during sign-in
-- Consider restricting columns via a view if needed
 drop policy if exists profiles_public_lookup on public.profiles;
create policy profiles_public_lookup
  on public.profiles for select
  using (true);

-- Allow users to manage their own profile rows (optional, helpful later)
 drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

 drop policy if exists profiles_self_modify on public.profiles;
create policy profiles_self_modify
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

