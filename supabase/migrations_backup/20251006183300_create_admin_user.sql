-- Create admin user and setup basic tables
-- Migration: 20251006183300_create_admin_user.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
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

-- Create customers table if needed for the admin to manage
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

-- Create battery_records table if needed
CREATE TABLE IF NOT EXISTS public.battery_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  voltage DECIMAL(5,2),
  capacity DECIMAL(6,2),
  customer_id UUID REFERENCES public.customers(id),
  location_id UUID REFERENCES public.locations(id),
  status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on battery_records
ALTER TABLE public.battery_records ENABLE ROW LEVEL SECURITY;

-- Create policy for battery_records
DROP POLICY IF EXISTS "battery_records_policy" ON public.battery_records;
CREATE POLICY "battery_records_policy" ON public.battery_records FOR ALL USING (true) WITH CHECK (true);
