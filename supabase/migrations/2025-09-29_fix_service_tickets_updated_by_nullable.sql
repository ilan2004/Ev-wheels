-- Migration: Allow NULLs in service_tickets.updated_by and harden audit triggers
-- Date: 2025-09-29
-- Rationale:
-- - Reset script using a service role triggers ON DELETE SET NULL cascades from vehicle_cases to service_tickets.vehicle_case_id.
-- - BEFORE UPDATE trigger set_updated_by_current_user() currently overwrites updated_by with get_jwt_user_id(),
--   which is NULL for service-role operations, causing NOT NULL violations on service_tickets.updated_by.
-- - We make updated_by nullable and update triggers/functions to avoid writing NULLs and to keep history consistent.

BEGIN;

-- 1) Allow NULLs in service_tickets.updated_by
ALTER TABLE service_tickets
  ALTER COLUMN updated_by DROP NOT NULL;

-- 2) Harden the trigger that maintains updated_by so it does not clobber with NULL
CREATE OR REPLACE FUNCTION set_updated_by_current_user()
RETURNS trigger AS $$
DECLARE
  uid uuid := get_jwt_user_id();
BEGIN
  -- Only overwrite when we actually have a caller user id
  IF uid IS NOT NULL THEN
    NEW.updated_by := uid;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) On INSERT, fill created_by/updated_by from JWT when present; otherwise leave as provided.
--    Ensure updated_by falls back to created_by when JWT missing and created_by is present.
CREATE OR REPLACE FUNCTION set_created_and_updated_by_defaults()
RETURNS trigger AS $$
DECLARE
  uid uuid := get_jwt_user_id();
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := COALESCE(uid, NEW.created_by);
  END IF;
  IF NEW.updated_by IS NULL THEN
    NEW.updated_by := COALESCE(uid, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers to ensure they point to the updated functions
DROP TRIGGER IF EXISTS trg_set_updated_by_on_service_tickets ON service_tickets;
CREATE TRIGGER trg_set_updated_by_on_service_tickets
BEFORE UPDATE ON service_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_by_current_user();

DROP TRIGGER IF EXISTS trg_set_cu_by_on_insert_service_tickets ON service_tickets;
CREATE TRIGGER trg_set_cu_by_on_insert_service_tickets
BEFORE INSERT ON service_tickets
FOR EACH ROW EXECUTE FUNCTION set_created_and_updated_by_defaults();

-- 4) Make service ticket history robust to NULL updated_by by falling back to created_by
CREATE OR REPLACE FUNCTION create_service_ticket_history()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    previous_vals JSONB;
    new_vals JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_type := 'created';
        previous_vals := NULL;
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            action_type := 'status_changed';
        ELSIF (OLD.triaged_at IS NULL AND NEW.triaged_at IS NOT NULL) THEN
            action_type := 'triaged';
        ELSE
            action_type := 'updated';
        END IF;
        previous_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    END IF;

    INSERT INTO service_ticket_history (
        ticket_id, action, previous_values, new_values, changed_by, notes
    ) VALUES (
        COALESCE(NEW.id, OLD.id), action_type, previous_vals, new_vals,
        COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by, OLD.created_by),
        CASE 
            WHEN action_type = 'created' THEN 'Service ticket created'
            WHEN action_type = 'triaged' THEN 'Ticket triaged and routed to appropriate department'
            WHEN action_type = 'status_changed' THEN 'Ticket status updated'
            ELSE 'Ticket updated'
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMIT;
