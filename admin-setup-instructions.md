# Create Administrator Account

## 🎯 **Goal**: Create admin user `ilan-admin` with password `ilan1234`

## 📋 **Method 1: Via Supabase Dashboard (Recommended)**

### Step 1: Run Database Setup
Execute this in your Supabase SQL Editor:

```sql
-- Create Administrator Account: ilan-admin
-- This script creates necessary tables and sets up permissions

-- First, let's check if we have the necessary tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'locations', 'user_locations')
ORDER BY table_name;

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
       'Ready to create user account' as next_step;
```

### Step 2: Create User via Supabase Auth Dashboard

1. **Go to Authentication in Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/sddolthuxysdqdrmvsxh
   - Go to **Authentication** → **Users**

2. **Create New User**
   - Click **"Add user"**
   - **Email**: `ilan-admin@yourdomain.com` (or any email)
   - **Password**: `ilan1234`
   - **Auto Confirm**: ✅ Check this
   - Click **Create User**

3. **Note the User ID**
   - Copy the generated User ID (UUID)

### Step 3: Create Profile for Admin User

After creating the user, run this SQL (replace `USER_ID_HERE` with the actual UUID):

```sql
-- Insert admin profile (replace USER_ID_HERE with actual user ID)
INSERT INTO public.profiles (user_id, username, email, first_name, last_name, role) 
VALUES (
  'USER_ID_HERE'::uuid,  -- Replace with actual user ID from Step 2
  'ilan-admin',
  'ilan-admin@yourdomain.com',  -- Same email used in Step 2
  'Ilan',
  'Admin',
  'administrator'
);

-- Assign admin to the main location
INSERT INTO public.user_locations (user_id, location_id) 
VALUES (
  'USER_ID_HERE'::uuid,  -- Replace with actual user ID
  'f7b5c2a0-1234-5678-9abc-123456789def'::uuid
);
```

## 📋 **Method 2: Via Application (Alternative)**

If your application has a sign-up feature:

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Navigate to sign-up page**
   - Go to your app's sign-up page
   - **Username**: `ilan-admin`
   - **Email**: `ilan-admin@yourdomain.com`
   - **Password**: `ilan1234`
   - Sign up

3. **The application should automatically create the profile**

## ✅ **Verification**

After creating the user, verify with these queries:

```sql
-- Check if user exists in auth
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'ilan-admin@yourdomain.com';

-- Check if profile was created
SELECT user_id, username, email, role 
FROM public.profiles 
WHERE username = 'ilan-admin';

-- Check location assignment
SELECT ul.user_id, l.name, l.code 
FROM public.user_locations ul
JOIN public.locations l ON ul.location_id = l.id
WHERE ul.user_id IN (SELECT user_id FROM public.profiles WHERE username = 'ilan-admin');
```

## 🎯 **Login Credentials**

Once created, you can log in with:
- **Username**: `ilan-admin`
- **Password**: `ilan1234`
- **Email**: `ilan-admin@yourdomain.com`

The user will have administrator privileges and access to all locations! 🚀
