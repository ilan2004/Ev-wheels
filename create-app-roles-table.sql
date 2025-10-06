-- Create app_roles table and fix admin role assignment
-- This should resolve the role detection issue

-- Create app_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_roles (
  user_id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on app_roles
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for app_roles
DROP POLICY IF EXISTS "app_roles_policy" ON public.app_roles;
CREATE POLICY "app_roles_policy" ON public.app_roles FOR ALL USING (true) WITH CHECK (true);

-- Insert/update admin role in app_roles table
INSERT INTO public.app_roles (user_id, role) 
VALUES ('e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid, 'admin') 
ON CONFLICT (user_id) DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Also update profiles table to use 'admin' instead of 'administrator'
UPDATE public.profiles 
SET role = 'admin'
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid;

-- Verification queries
SELECT 'app_roles verification:' as check_type,
       user_id, role, created_at
FROM public.app_roles 
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid;

SELECT 'profiles verification:' as check_type,
       user_id, username, role 
FROM public.profiles 
WHERE user_id = 'e46a6a94-8e46-484b-8f6b-c05e58ae1507'::uuid;

SELECT 'All app_roles:' as check_type, user_id, role FROM public.app_roles;

SELECT 'Fix completed!' as status, 'User should now have admin access' as message;
