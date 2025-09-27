-- Phase 0 - RLS-friendly defaults and audit triggers for service tickets
-- Safe defaults so client inserts work with RLS without leaking privilege

-- 1) Set defaults to auth.uid() where appropriate
ALTER TABLE service_tickets 
  ALTER COLUMN created_by SET DEFAULT auth.uid(),
  ALTER COLUMN updated_by SET DEFAULT auth.uid();

ALTER TABLE vehicle_cases 
  ALTER COLUMN created_by SET DEFAULT auth.uid(),
  ALTER COLUMN updated_by SET DEFAULT auth.uid();

ALTER TABLE ticket_attachments 
  ALTER COLUMN uploaded_by SET DEFAULT auth.uid();

-- 2) Keep updated_by current user on updates
CREATE OR REPLACE FUNCTION set_updated_by_current_user()
RETURNS trigger AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_by_on_service_tickets ON service_tickets;
CREATE TRIGGER trg_set_updated_by_on_service_tickets
BEFORE UPDATE ON service_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_by_current_user();

DROP TRIGGER IF EXISTS trg_set_updated_by_on_vehicle_cases ON vehicle_cases;
CREATE TRIGGER trg_set_updated_by_on_vehicle_cases
BEFORE UPDATE ON vehicle_cases
FOR EACH ROW EXECUTE FUNCTION set_updated_by_current_user();

-- 3) Optionally normalize created_by/updated_by on insert (no-op if client omits)
CREATE OR REPLACE FUNCTION set_created_and_updated_by_defaults()
RETURNS trigger AS $$
BEGIN
  IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
  IF NEW.updated_by IS NULL THEN NEW.updated_by := auth.uid(); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_cu_by_on_insert_service_tickets ON service_tickets;
CREATE TRIGGER trg_set_cu_by_on_insert_service_tickets
BEFORE INSERT ON service_tickets
FOR EACH ROW EXECUTE FUNCTION set_created_and_updated_by_defaults();

DROP TRIGGER IF EXISTS trg_set_cu_by_on_insert_vehicle_cases ON vehicle_cases;
CREATE TRIGGER trg_set_cu_by_on_insert_vehicle_cases
BEFORE INSERT ON vehicle_cases
FOR EACH ROW EXECUTE FUNCTION set_created_and_updated_by_defaults();
