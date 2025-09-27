-- WARNING: Development-only policies for customers.
-- Adjust or remove in production.

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow read for all (anon + authenticated)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_select_all'
  ) THEN
    CREATE POLICY customers_select_all ON customers FOR SELECT USING (true);
  END IF;
END $$;

-- Allow insert for anon (development convenience)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_insert_anon'
  ) THEN
    CREATE POLICY customers_insert_anon ON customers FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- Allow update for anon (development convenience)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_update_anon'
  ) THEN
    CREATE POLICY customers_update_anon ON customers FOR UPDATE TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
