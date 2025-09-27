-- Make RLS work with Clerk tokens where sub is not a UUID
-- We extract user UUID from either sub (if UUID) or custom claim user_id

-- 1) Helper that returns a UUID from JWT
CREATE OR REPLACE FUNCTION get_jwt_user_id()
RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN (auth.jwt() ->> 'sub') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN (auth.jwt() ->> 'sub')::uuid
    WHEN (auth.jwt() ->> 'user_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN (auth.jwt() ->> 'user_id')::uuid
    ELSE NULL::uuid
  END;
$$;

-- 2) Make is_admin recognize app_role claim (fallback to role)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'app_role') = 'admin' OR (auth.jwt() ->> 'role') = 'admin', false);
$$;

-- 3) Update column defaults to use get_jwt_user_id()
ALTER TABLE service_tickets 
  ALTER COLUMN created_by SET DEFAULT get_jwt_user_id(),
  ALTER COLUMN updated_by SET DEFAULT get_jwt_user_id();

ALTER TABLE vehicle_cases 
  ALTER COLUMN created_by SET DEFAULT get_jwt_user_id(),
  ALTER COLUMN updated_by SET DEFAULT get_jwt_user_id();

ALTER TABLE ticket_attachments 
  ALTER COLUMN uploaded_by SET DEFAULT get_jwt_user_id();

-- 4) Update triggers to use get_jwt_user_id()
CREATE OR REPLACE FUNCTION set_updated_by_current_user()
RETURNS trigger AS $$
BEGIN
  NEW.updated_by := get_jwt_user_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_created_and_updated_by_defaults()
RETURNS trigger AS $$
BEGIN
  IF NEW.created_by IS NULL THEN NEW.created_by := get_jwt_user_id(); END IF;
  IF NEW.updated_by IS NULL THEN NEW.updated_by := get_jwt_user_id(); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers exist
DROP TRIGGER IF EXISTS trg_set_updated_by_on_service_tickets ON service_tickets;
CREATE TRIGGER trg_set_updated_by_on_service_tickets
BEFORE UPDATE ON service_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_by_current_user();

DROP TRIGGER IF EXISTS trg_set_updated_by_on_vehicle_cases ON vehicle_cases;
CREATE TRIGGER trg_set_updated_by_on_vehicle_cases
BEFORE UPDATE ON vehicle_cases
FOR EACH ROW EXECUTE FUNCTION set_updated_by_current_user();

DROP TRIGGER IF EXISTS trg_set_cu_by_on_insert_service_tickets ON service_tickets;
CREATE TRIGGER trg_set_cu_by_on_insert_service_tickets
BEFORE INSERT ON service_tickets
FOR EACH ROW EXECUTE FUNCTION set_created_and_updated_by_defaults();

DROP TRIGGER IF EXISTS trg_set_cu_by_on_insert_vehicle_cases ON vehicle_cases;
CREATE TRIGGER trg_set_cu_by_on_insert_vehicle_cases
BEFORE INSERT ON vehicle_cases
FOR EACH ROW EXECUTE FUNCTION set_created_and_updated_by_defaults();

-- 5) Recreate RLS policies to use get_jwt_user_id()
-- service_tickets
DROP POLICY IF EXISTS service_tickets_select ON service_tickets;
CREATE POLICY service_tickets_select
  ON service_tickets FOR SELECT TO authenticated
  USING (created_by = get_jwt_user_id() OR assigned_to = get_jwt_user_id() OR is_admin());

DROP POLICY IF EXISTS service_tickets_insert_own ON service_tickets;
CREATE POLICY service_tickets_insert_own
  ON service_tickets FOR INSERT TO authenticated
  WITH CHECK (created_by = get_jwt_user_id() OR is_admin());

DROP POLICY IF EXISTS service_tickets_update_owner_or_assignee ON service_tickets;
CREATE POLICY service_tickets_update_owner_or_assignee
  ON service_tickets FOR UPDATE TO authenticated
  USING (created_by = get_jwt_user_id() OR assigned_to = get_jwt_user_id() OR is_admin())
  WITH CHECK (created_by = get_jwt_user_id() OR assigned_to = get_jwt_user_id() OR is_admin());

DROP POLICY IF EXISTS service_tickets_delete_admin ON service_tickets;
CREATE POLICY service_tickets_delete_admin
  ON service_tickets FOR DELETE TO authenticated
  USING (is_admin());

-- ticket_attachments
DROP POLICY IF EXISTS ticket_attachments_select ON ticket_attachments;
CREATE POLICY ticket_attachments_select
  ON ticket_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (t.created_by = get_jwt_user_id() OR t.assigned_to = get_jwt_user_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS ticket_attachments_insert ON ticket_attachments;
CREATE POLICY ticket_attachments_insert
  ON ticket_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (t.created_by = get_jwt_user_id() OR t.assigned_to = get_jwt_user_id() OR is_admin())
    )
  );

DROP POLICY IF EXISTS ticket_attachments_update ON ticket_attachments;
CREATE POLICY ticket_attachments_update
  ON ticket_attachments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (t.created_by = get_jwt_user_id() OR t.assigned_to = get_jwt_user_id() OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (t.created_by = get_jwt_user_id() OR t.assigned_to = get_jwt_user_id() OR is_admin())
    )
  );
