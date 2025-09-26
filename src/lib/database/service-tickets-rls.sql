-- Service Tickets - RLS Policies (Phase 0)

-- Helper: simple admin check via custom JWT claim `role=admin`
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'role') = 'admin', false);
$$;

-- Service Tickets policies
CREATE POLICY "service_tickets_select"
  ON service_tickets
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR is_admin()
  );

CREATE POLICY "service_tickets_insert_own"
  ON service_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() OR is_admin()
  );

CREATE POLICY "service_tickets_update_owner_or_assignee"
  ON service_tickets
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR is_admin()
  )
  WITH CHECK (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR is_admin()
  );

-- Optional: restrict deletes to admins only (omit if you want to forbid deletes)
CREATE POLICY "service_tickets_delete_admin"
  ON service_tickets
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Ticket Attachments policies (scope via parent ticket ownership/assignment)
CREATE POLICY "ticket_attachments_select"
  ON ticket_attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR is_admin()
        )
    )
  );

CREATE POLICY "ticket_attachments_insert"
  ON ticket_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR is_admin()
        )
    )
  );

CREATE POLICY "ticket_attachments_update"
  ON ticket_attachments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR is_admin()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id
        AND (
          t.created_by = auth.uid()
          OR t.assigned_to = auth.uid()
          OR is_admin()
        )
    )
  );

