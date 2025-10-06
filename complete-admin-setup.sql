-- Complete Admin Setup SQL - Run this in Supabase SQL Editor
-- User ID: e46a6a94-8e46-484b-8f6b-c05e58ae1507

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, location_id)
);

-- Enable RLS on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (allow all operations)
DROP POLICY IF EXISTS "locations_policy" ON public.locations;
CREATE POLICY "locations_policy" ON public.locations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
CREATE POLICY "profiles_policy" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "user_locations_policy" ON public.user_locations;
CREATE POLICY "user_locations_policy" ON public.user_locations FOR ALL USING (true) WITH CHECK (true);

-- Create default location
INSERT INTO public.locations (id, name, code, address) 
VALUES (
  'f7b5c2a0-1234-5678-9abc-123456789def'::uuid,
  'Main Branch',
  'MAIN001',
  'Head Office Location'
) ON CONFLICT (code) DO NOTHING;

-- Create admin profile (using the actual user ID created)
INSERT INTO public.profiles (user_id, username, email, first_name, last_name, role) 
VALUES (
  'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid,  -- Actual user ID
  'ilan-admin',
  'ilan-admin@evwheels.com',
  'Ilan',
  'Administrator',
  'administrator'
) ON CONFLICT (user_id) DO NOTHING;

-- Assign admin to the main location
INSERT INTO public.user_locations (user_id, location_id) 
VALUES (
  'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid,  -- Actual user ID
  'f7b5c2a0-1234-5678-9abc-123456789def'::uuid
) ON CONFLICT (user_id, location_id) DO NOTHING;

-- Create basic customers table for admin to manage
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  address TEXT,
  location_id UUID REFERENCES public.locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy for customers
DROP POLICY IF EXISTS "customers_policy" ON public.customers;
CREATE POLICY "customers_policy" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Display success message and verification
SELECT 'Admin setup completed!' as status,
       'ilan-admin user is ready to login' as message;

-- Verification queries
SELECT 'User verification:' as check_type, 
       id, email, created_at 
FROM auth.users 
WHERE id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid;

SELECT 'Profile verification:' as check_type,
       user_id, username, email, role 
FROM public.profiles 
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid;

SELECT 'Location assignment verification:' as check_type,
       ul.user_id, l.name as location_name, l.code
FROM public.user_locations ul
JOIN public.locations l ON ul.location_id = l.id
WHERE ul.user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid;
