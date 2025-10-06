-- Create Administrator Account: ilan-admin
-- This script creates a user directly in Supabase Auth and sets up their profile

-- First, let's check if we have the necessary tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'locations', 'user_locations')
ORDER BY table_name;

-- Create the user in auth.users (this might need to be done via Supabase Auth API)
-- Note: Direct insertion into auth.users is typically restricted
-- We'll create a profile entry and the user can be created via the application

-- First, let's create a locations table if it doesn't exist
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

-- Enable RLS on tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
DROP POLICY IF EXISTS "Admin full access locations" ON public.locations;
CREATE POLICY "Admin full access locations" ON public.locations
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;
CREATE POLICY "Admin full access profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access user_locations" ON public.user_locations;
CREATE POLICY "Admin full access user_locations" ON public.user_locations
  FOR ALL USING (true) WITH CHECK (true);

-- Create a default location
INSERT INTO public.locations (id, name, code, address) 
VALUES (
  'f7b5c2a0-1234-5678-9abc-123456789def'::uuid,
  'Main Branch',
  'MAIN001',
  'Head Office Location'
) ON CONFLICT (code) DO NOTHING;

-- Display success message
SELECT 'Database setup completed!' as status,
       'Tables created and policies configured' as message,
       'User must sign up via the application with username: ilan-admin' as next_step;
