-- Add Malappuram location to the database
-- This will add Malappuram alongside existing Kochi and Thrissur locations
-- Following the same pattern as the existing location seed migration

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert Malappuram location (idempotent using ON CONFLICT)
INSERT INTO public.locations (id, name, code)
VALUES (gen_random_uuid(), 'Malappuram', 'MALAPPURAM')
ON CONFLICT (code) DO NOTHING;

-- Verify all locations exist
SELECT 
  id,
  name,
  code,
  created_at
FROM public.locations
ORDER BY name;
