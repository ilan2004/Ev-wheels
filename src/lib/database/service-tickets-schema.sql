-- Service Tickets Implementation - Phase 0 Database Schema
-- Extends the existing BMS system with service ticket management

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service Ticket Status enum
CREATE TYPE service_ticket_status AS ENUM (
  'reported',
  'triaged',
  'assigned', 
  'in_progress',
  'completed',
  'delivered',
  'closed',
  'cancelled',
  'on_hold',
  'waiting_approval'
);

-- Vehicle Status enum (mirrors battery status for consistency)
CREATE TYPE vehicle_status AS ENUM (
  'received',
  'diagnosed', 
  'in_progress',
  'completed',
  'delivered',
  'cancelled',
  'on_hold'
);

-- Attachment Type enum
CREATE TYPE attachment_type AS ENUM (
  'photo',
  'audio',
  'document'
);

-- Case Type enum (for linking attachments to specific cases)
CREATE TYPE case_type AS ENUM (
  'battery',
  'vehicle'
);

-- Service Tickets table (parent tickets)
CREATE TABLE service_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  ticket_number VARCHAR(50) NOT NULL UNIQUE, -- Format: T-YYYYMMDD-NNN
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  -- Problem Description
  symptom TEXT NOT NULL, -- Customer reported issue
  description TEXT, -- Additional details
  
  -- Vehicle Information (optional)
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_reg_no VARCHAR(50),
  vehicle_year INTEGER,
  
  -- Status and Assignment
  status service_ticket_status NOT NULL DEFAULT 'reported',
  priority INTEGER DEFAULT 3, -- 1=High, 2=Medium, 3=Low
  assigned_to UUID, -- Reference to user/technician
  
  -- Linked Cases (nullable - set during triage)
  battery_case_id UUID REFERENCES battery_records(id) ON DELETE SET NULL,
  vehicle_case_id UUID, -- Will reference vehicle_cases table
  
  -- Timestamps and Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL, -- Reference to user
  updated_by UUID NOT NULL, -- Reference to user
  
  -- Triage Information
  triaged_at TIMESTAMP WITH TIME ZONE,
  triaged_by UUID, -- Reference to user
  triage_notes TEXT
);

-- Ticket Attachments table
CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationship
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  case_type case_type, -- Optional: link to specific case (battery/vehicle)
  case_id UUID, -- Optional: specific battery_id or vehicle_case_id
  
  -- File Information
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL, -- Full path in Supabase Storage
  file_size BIGINT NOT NULL, -- Size in bytes
  mime_type VARCHAR(100) NOT NULL,
  attachment_type attachment_type NOT NULL,
  
  -- Metadata
  thumbnail_path TEXT, -- For photos
  duration INTEGER, -- For audio files (seconds)
  
  -- Upload Information
  uploaded_by UUID NOT NULL, -- Reference to user
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'internal', -- 'internal', 'customer-portal', etc.
  uploader_fingerprint TEXT, -- For tracking customer uploads
  
  -- Processing Status
  processed BOOLEAN DEFAULT FALSE,
  processing_error TEXT
);

-- Vehicle Cases table (mirrors battery_records structure)
CREATE TABLE vehicle_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to parent ticket
  service_ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE RESTRICT,
  
  -- Vehicle Information (copied from ticket or entered separately)
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_reg_no VARCHAR(50) NOT NULL,
  vehicle_year INTEGER,
  vin_number VARCHAR(100),
  
  -- Customer Information (inherited from ticket)
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  -- Service Information
  received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_date TIMESTAMP WITH TIME ZONE,
  status vehicle_status NOT NULL DEFAULT 'received',
  
  -- Technical Information
  initial_diagnosis TEXT,
  symptoms_observed TEXT,
  diagnostic_notes TEXT,
  repair_notes TEXT,
  technician_notes TEXT,
  
  -- Parts and Labor
  parts_required TEXT[], -- Array of part descriptions
  parts_cost DECIMAL(10,2),
  labor_hours DECIMAL(4,2) DEFAULT 0,
  labor_cost DECIMAL(10,2),
  
  -- Pricing
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  
  -- Assignment
  assigned_technician UUID, -- Reference to user
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL, -- Reference to user
  updated_by UUID NOT NULL  -- Reference to user
);

-- Vehicle Status History table (mirrors battery_status_history)
CREATE TABLE vehicle_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_case_id UUID NOT NULL REFERENCES vehicle_cases(id) ON DELETE CASCADE,
  previous_status vehicle_status,
  new_status vehicle_status NOT NULL,
  changed_by UUID NOT NULL, -- Reference to user
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Service Ticket History table (audit trail)
CREATE TABLE service_ticket_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  
  -- Change Information
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'triaged', 'assigned', 'status_changed'
  previous_values JSONB, -- Store previous state for rollback
  new_values JSONB, -- Store new state
  
  -- User and Timestamp
  changed_by UUID NOT NULL, -- Reference to user
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Indexes for better performance
-- Service Tickets indexes
CREATE INDEX idx_service_tickets_ticket_number ON service_tickets(ticket_number);
CREATE INDEX idx_service_tickets_customer ON service_tickets(customer_id);
CREATE INDEX idx_service_tickets_status ON service_tickets(status);
CREATE INDEX idx_service_tickets_created_at ON service_tickets(created_at);
CREATE INDEX idx_service_tickets_assigned_to ON service_tickets(assigned_to);
CREATE INDEX idx_service_tickets_battery_case ON service_tickets(battery_case_id);
CREATE INDEX idx_service_tickets_vehicle_case ON service_tickets(vehicle_case_id);

-- Attachments indexes
CREATE INDEX idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_type ON ticket_attachments(attachment_type);
CREATE INDEX idx_ticket_attachments_uploaded_at ON ticket_attachments(uploaded_at);

-- Vehicle Cases indexes
CREATE INDEX idx_vehicle_cases_ticket ON vehicle_cases(service_ticket_id);
CREATE INDEX idx_vehicle_cases_customer ON vehicle_cases(customer_id);
CREATE INDEX idx_vehicle_cases_status ON vehicle_cases(status);
CREATE INDEX idx_vehicle_cases_reg_no ON vehicle_cases(vehicle_reg_no);
CREATE INDEX idx_vehicle_cases_received_date ON vehicle_cases(received_date);

-- History indexes
CREATE INDEX idx_vehicle_status_history_vehicle ON vehicle_status_history(vehicle_case_id);
CREATE INDEX idx_vehicle_status_history_changed_at ON vehicle_status_history(changed_at);
CREATE INDEX idx_service_ticket_history_ticket ON service_ticket_history(ticket_id);
CREATE INDEX idx_service_ticket_history_changed_at ON service_ticket_history(changed_at);

-- Auto-increment ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    today_str TEXT;
    sequence_num INTEGER;
    ticket_num TEXT;
BEGIN
    today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get the next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '\-(\d+)$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM service_tickets 
    WHERE ticket_number LIKE 'T-' || today_str || '-%';
    
    ticket_num := 'T-' || today_str || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_tickets_ticket_number_trigger
    BEFORE INSERT ON service_tickets
    FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

-- Update timestamps triggers
CREATE TRIGGER update_service_tickets_updated_at
    BEFORE UPDATE ON service_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_cases_updated_at
    BEFORE UPDATE ON vehicle_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vehicle status history trigger (mirrors battery status history)
CREATE OR REPLACE FUNCTION create_vehicle_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history if status actually changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO vehicle_status_history (
            vehicle_case_id,
            previous_status,
            new_status,
            changed_by,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.updated_by,
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

CREATE TRIGGER vehicle_status_history_trigger
    AFTER UPDATE ON vehicle_cases
    FOR EACH ROW EXECUTE FUNCTION create_vehicle_status_history();

-- Service ticket history trigger
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
        -- Determine the type of update
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
        ticket_id,
        action,
        previous_values,
        new_values,
        changed_by,
        notes
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        action_type,
        previous_vals,
        new_vals,
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

CREATE TRIGGER service_ticket_history_trigger
    AFTER INSERT OR UPDATE ON service_tickets
    FOR EACH ROW EXECUTE FUNCTION create_service_ticket_history();

-- Add foreign key constraint for vehicle_case_id (self-referencing)
ALTER TABLE service_tickets 
ADD CONSTRAINT fk_service_tickets_vehicle_case 
FOREIGN KEY (vehicle_case_id) REFERENCES vehicle_cases(id) ON DELETE SET NULL;

-- RLS (Row Level Security) policies will be added in the next step
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_ticket_history ENABLE ROW LEVEL SECURITY;
