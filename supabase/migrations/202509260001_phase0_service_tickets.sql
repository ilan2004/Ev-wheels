-- Phase 0 Migration: Service Tickets (schema + RLS + storage)
-- Apply this in Supabase SQL Editor or via Supabase CLI

-- ==========================
-- Schema
-- ==========================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service Ticket Status enum
DO $$ BEGIN
  CREATE TYPE service_ticket_status AS ENUM (
    'reported','triaged','assigned','in_progress','completed','delivered','closed','cancelled','on_hold','waiting_approval'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vehicle Status enum
DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM (
    'received','diagnosed','in_progress','completed','delivered','cancelled','on_hold'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Attachment Type enum
DO $$ BEGIN
  CREATE TYPE attachment_type AS ENUM ('photo','audio','document');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Case Type enum
DO $$ BEGIN
  CREATE TYPE case_type AS ENUM ('battery','vehicle');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tables (only create if not exists)
CREATE TABLE IF NOT EXISTS service_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  symptom TEXT NOT NULL,
  description TEXT,
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_reg_no VARCHAR(50),
  vehicle_year INTEGER,
  status service_ticket_status NOT NULL DEFAULT 'reported',
  priority INTEGER DEFAULT 3,
  assigned_to UUID,
  battery_case_id UUID REFERENCES battery_records(id) ON DELETE SET NULL,
  vehicle_case_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  triaged_at TIMESTAMP WITH TIME ZONE,
  triaged_by UUID,
  triage_notes TEXT
);

CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  case_type case_type,
  case_id UUID,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  attachment_type attachment_type NOT NULL,
  thumbnail_path TEXT,
  duration INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'internal',
  uploader_fingerprint TEXT,
  processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT
);

CREATE TABLE IF NOT EXISTS vehicle_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE RESTRICT,
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  vehicle_year INTEGER,
  vin_number VARCHAR(100),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_date TIMESTAMP WITH TIME ZONE,
  status vehicle_status NOT NULL DEFAULT 'received',
  initial_diagnosis TEXT,
  symptoms_observed TEXT,
  diagnostic_notes TEXT,
  repair_notes TEXT,
  technician_notes TEXT,
  parts_required TEXT[],
  parts_cost DECIMAL(10,2),
  labor_hours DECIMAL(4,2) DEFAULT 0,
  labor_cost DECIMAL(10,2),
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  assigned_technician UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_case_id UUID NOT NULL REFERENCES vehicle_cases(id) ON DELETE CASCADE,
  previous_status vehicle_status,
  new_status vehicle_status NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS service_ticket_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_tickets_ticket_number ON service_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_service_tickets_customer ON service_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_service_tickets_created_at ON service_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_service_tickets_assigned_to ON service_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_tickets_battery_case ON service_tickets(battery_case_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_vehicle_case ON service_tickets(vehicle_case_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_type ON ticket_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_at ON ticket_attachments(uploaded_at);

CREATE INDEX IF NOT EXISTS idx_vehicle_cases_ticket ON vehicle_cases(service_ticket_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_customer ON vehicle_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_status ON vehicle_cases(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_reg_no ON vehicle_cases(vehicle_reg_no);
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_received_date ON vehicle_cases(received_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_status_history_vehicle ON vehicle_status_history(vehicle_case_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_status_history_changed_at ON vehicle_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_service_ticket_history_ticket ON service_ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_service_ticket_history_changed_at ON service_ticket_history(changed_at);

-- Ticket number generator + triggers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    today_str TEXT;
    sequence_num INTEGER;
    ticket_num TEXT;
BEGIN
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\\-(\\d+)$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM service_tickets
    WHERE ticket_number LIKE 'T-' || today_str || '-%';
    ticket_num := 'T-' || today_str || '-' || LPAD(sequence_num::TEXT, 3, '0');
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_tickets_ticket_number_trigger ON service_tickets;
CREATE TRIGGER service_tickets_ticket_number_trigger
    BEFORE INSERT ON service_tickets
    FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

-- Ensure timestamp update helper exists (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Timestamp triggers (reuse existing function update_updated_at_column())
DROP TRIGGER IF EXISTS update_service_tickets_updated_at ON service_tickets;
CREATE TRIGGER update_service_tickets_updated_at
    BEFORE UPDATE ON service_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicle_cases_updated_at ON vehicle_cases;
CREATE TRIGGER update_vehicle_cases_updated_at
    BEFORE UPDATE ON vehicle_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Status history trigger for vehicles
CREATE OR REPLACE FUNCTION create_vehicle_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO vehicle_status_history (
            vehicle_case_id, previous_status, new_status, changed_by, notes
        ) VALUES (
            NEW.id, OLD.status, NEW.status, NEW.updated_by,
            CASE 
                WHEN NEW.status = 'delivered' THEN 'Vehicle delivered to customer'
                WHEN NEW.status = 'completed' THEN 'Repair work completed'
                WHEN NEW.status = 'in_progress' THEN 'Repair work started'
                WHEN NEW.status = 'diagnosed' THEN 'Initial diagnosis completed'
                ELSE 'Status updated'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicle_status_history_trigger ON vehicle_cases;
CREATE TRIGGER vehicle_status_history_trigger
    AFTER UPDATE ON vehicle_cases
    FOR EACH ROW EXECUTE FUNCTION create_vehicle_status_history();

-- Service ticket audit trigger
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
        ELSIF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
            action_type := 'assigned';
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
        COALESCE(NEW.updated_by, OLD.updated_by),
        CASE 
            WHEN action_type = 'created' THEN 'Service ticket created'
            WHEN action_type = 'triaged' THEN 'Ticket triaged and routed to appropriate department'
            WHEN action_type = 'assigned' THEN 'Ticket assigned to technician'
            WHEN action_type = 'status_changed' THEN 'Ticket status updated'
            ELSE 'Ticket updated'
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS service_ticket_history_trigger ON service_tickets;
CREATE TRIGGER service_ticket_history_trigger
    AFTER INSERT OR UPDATE ON service_tickets
    FOR EACH ROW EXECUTE FUNCTION create_service_ticket_history();

-- Add FK for vehicle_case_id after vehicle_cases exists
DO $$ BEGIN
  ALTER TABLE service_tickets
  ADD CONSTRAINT fk_service_tickets_vehicle_case
  FOREIGN KEY (vehicle_case_id) REFERENCES vehicle_cases(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Enable RLS
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
-- vehicle_cases RLS can be added later phases

-- ==========================
-- RLS Policies
-- ==========================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE((auth.jwt() ->> 'role') = 'admin', false);
$$;

-- Service tickets
DROP POLICY IF EXISTS service_tickets_select ON service_tickets;
CREATE POLICY service_tickets_select
  ON service_tickets FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid() OR is_admin());

DROP POLICY IF EXISTS service_tickets_insert_own ON service_tickets;
CREATE POLICY service_tickets_insert_own
  ON service_tickets FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR is_admin());

DROP POLICY IF EXISTS service_tickets_update_owner_or_assignee ON service_tickets;
CREATE POLICY service_tickets_update_owner_or_assignee
  ON service_tickets FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid() OR is_admin())
  WITH CHECK (created_by = auth.uid() OR assigned_to = auth.uid() OR is_admin());

DROP POLICY IF EXISTS service_tickets_delete_admin ON service_tickets;
CREATE POLICY service_tickets_delete_admin
  ON service_tickets FOR DELETE TO authenticated
  USING (is_admin());

-- Attachments
DROP POLICY IF EXISTS ticket_attachments_select ON ticket_attachments;
CREATE POLICY ticket_attachments_select
  ON ticket_attachments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR is_admin())
    )
  );

DROP POLICY IF EXISTS ticket_attachments_insert ON ticket_attachments;
CREATE POLICY ticket_attachments_insert
  ON ticket_attachments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR is_admin())
    )
  );

DROP POLICY IF EXISTS ticket_attachments_update ON ticket_attachments;
CREATE POLICY ticket_attachments_update
  ON ticket_attachments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR is_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_tickets t
      WHERE t.id = ticket_id AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid() OR is_admin())
    )
  );

-- ==========================
-- Storage Buckets
-- ==========================
-- Create storage buckets (compatible with older/newer storage versions)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-photos', 'media-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-audio', 'media-audio', false)
ON CONFLICT (id) DO NOTHING;

