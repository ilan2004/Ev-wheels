-- Customers: add columns (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alt_contact TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Customers audit log (optional but recommended for merges)
CREATE TABLE IF NOT EXISTS customers_audit (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  action TEXT NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance (optional but recommended for fast ILIKE)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON customers USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_contact_trgm ON customers USING gin (contact gin_trgm_ops);
