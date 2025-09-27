-- E-Wheels BMS Database Schema
-- Battery Management System tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Battery Status enum
CREATE TYPE battery_status AS ENUM (
  'received',
  'diagnosed', 
  'in_progress',
  'completed',
  'delivered',
  'cancelled',
  'on_hold'
);

-- Battery Type enum
CREATE TYPE battery_type AS ENUM (
  'li-ion',
  'lfp', 
  'nmc',
  'other'
);

-- Cell Type enum  
CREATE TYPE cell_type AS ENUM (
  '18650',
  '21700',
  'prismatic',
  'pouch'
);

-- Repair Type enum
CREATE TYPE repair_type AS ENUM (
  'cell_replacement',
  'bms_replacement',
  'cell_balancing', 
  'full_reconditioning',
  'battery_pack_replacement',
  'diagnostic_only'
);

-- BMS Status enum
CREATE TYPE bms_status AS ENUM (
  'ok',
  'faulty',
  'replaced', 
  'unknown'
);

-- Balancing Status enum
CREATE TYPE balancing_status AS ENUM (
  'required',
  'completed',
  'not_needed'
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battery Records table
CREATE TABLE battery_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Battery Information
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  battery_type battery_type NOT NULL,
  voltage DECIMAL(5,2) NOT NULL,
  capacity DECIMAL(6,2) NOT NULL,
  cell_type cell_type,
  cell_count INTEGER,
  
  -- Customer Information
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  
  -- Service Information
  received_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_date TIMESTAMP WITH TIME ZONE,
  status battery_status NOT NULL DEFAULT 'received',
  
  -- Technical Diagnostics
  initial_voltage DECIMAL(6,2),
  load_test_result DECIMAL(5,2), -- Percentage efficiency
  ir_values DECIMAL[], -- Array of IR values
  cell_voltages DECIMAL[], -- Array of cell voltages
  bms_status bms_status DEFAULT 'unknown',
  
  -- Repair Details
  repair_type repair_type,
  cells_replaced INTEGER DEFAULT 0,
  rows_replaced INTEGER DEFAULT 0,
  repair_notes TEXT NOT NULL DEFAULT '',
  technician_notes TEXT,
  
  -- Pricing
  estimated_cost DECIMAL(10,2),
  final_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL, -- Reference to user
  updated_by UUID NOT NULL  -- Reference to user
);

-- Battery Status History table
CREATE TABLE battery_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battery_id UUID NOT NULL REFERENCES battery_records(id) ON DELETE CASCADE,
  previous_status battery_status,
  new_status battery_status NOT NULL,
  changed_by UUID NOT NULL, -- Reference to user
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Repair Estimates table
CREATE TABLE repair_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battery_id UUID NOT NULL REFERENCES battery_records(id) ON DELETE CASCADE,
  repair_type repair_type NOT NULL,
  estimated_cost DECIMAL(10,2) NOT NULL,
  parts_needed TEXT[], -- Array of part descriptions
  labor_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL, -- Reference to user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technical Diagnostics table
CREATE TABLE technical_diagnostics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battery_id UUID NOT NULL REFERENCES battery_records(id) ON DELETE CASCADE,
  
  -- Cell Analysis
  total_cells INTEGER NOT NULL,
  healthy_cells INTEGER NOT NULL DEFAULT 0,
  weak_cells INTEGER NOT NULL DEFAULT 0,
  dead_cells INTEGER NOT NULL DEFAULT 0,
  cells_above_threshold INTEGER NOT NULL DEFAULT 0,
  ir_threshold DECIMAL(6,2) NOT NULL DEFAULT 30.0,
  
  -- Performance Metrics
  current_capacity DECIMAL(6,2),
  capacity_retention DECIMAL(5,2), -- Percentage
  load_test_current DECIMAL(6,2),
  load_test_duration INTEGER, -- Minutes
  efficiency_rating DECIMAL(5,2), -- Percentage
  
  -- BMS Diagnostics  
  bms_firmware_version VARCHAR(50),
  bms_error_codes TEXT[], -- Array of error codes
  balancing_status balancing_status DEFAULT 'not_needed',
  
  -- Environmental
  test_temperature DECIMAL(5,2) NOT NULL DEFAULT 25.0,
  humidity DECIMAL(5,2),
  
  -- Timestamps
  diagnosed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diagnosed_by UUID NOT NULL -- Reference to user
);

-- Indexes for better performance
CREATE INDEX idx_battery_records_serial ON battery_records(serial_number);
CREATE INDEX idx_battery_records_customer ON battery_records(customer_id);
CREATE INDEX idx_battery_records_status ON battery_records(status);
CREATE INDEX idx_battery_records_brand ON battery_records(brand);
CREATE INDEX idx_battery_records_voltage ON battery_records(voltage);
CREATE INDEX idx_battery_records_received_date ON battery_records(received_date);
CREATE INDEX idx_battery_records_delivered_date ON battery_records(delivered_date);

CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_contact ON customers(contact);

CREATE INDEX idx_status_history_battery ON battery_status_history(battery_id);
CREATE INDEX idx_status_history_changed_at ON battery_status_history(changed_at);

CREATE INDEX idx_diagnostics_battery ON technical_diagnostics(battery_id);
CREATE INDEX idx_diagnostics_diagnosed_at ON technical_diagnostics(diagnosed_at);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battery_records_updated_at 
  BEFORE UPDATE ON battery_records 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create status history entry
CREATE OR REPLACE FUNCTION create_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history if status actually changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO battery_status_history (
            battery_id,
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
                WHEN NEW.status = 'delivered' THEN 'Battery delivered to customer'
                WHEN NEW.status = 'completed' THEN 'Repair work completed'
                WHEN NEW.status = 'in_progress' THEN 'Repair work started'
                WHEN NEW.status = 'diagnosed' THEN 'Initial diagnosis completed'
                ELSE 'Status updated'
            END
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER battery_status_history_trigger
  AFTER UPDATE ON battery_records
  FOR EACH ROW EXECUTE FUNCTION create_status_history();

-- RLS (Row Level Security) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE battery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_diagnostics ENABLE ROW LEVEL SECURITY;

-- Sample data based on PDF (first few entries for testing)
INSERT INTO customers (id, name, contact) VALUES 
  (uuid_generate_v4(), 'Basheer', '9946467546'),
  (uuid_generate_v4(), 'Abdhul Manaf', ''),
  (uuid_generate_v4(), 'Marwell Group', '7510712721'),
  (uuid_generate_v4(), 'Anand', '9846161043'),
  (uuid_generate_v4(), 'Shaji', '9947510061'),
  (uuid_generate_v4(), 'VINEESH', '9745284468'),
  (uuid_generate_v4(), 'Afzal', '9633173698');

-- Phase 1: Customers module additions (idempotent)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alt_contact TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Phase 4: Customers audit table (optional)
CREATE TABLE IF NOT EXISTS customers_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID,
  action TEXT NOT NULL,
  previous_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase 5: Performance indexes (optional)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON customers USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_contact_trgm ON customers USING gin (contact gin_trgm_ops);

-- Sample battery records from PDF data
-- Note: In production, you'd want proper user IDs instead of uuid_generate_v4()
INSERT INTO battery_records (
  serial_number, brand, battery_type, voltage, capacity, cell_type,
  customer_id, status, repair_notes, estimated_cost, final_cost,
  created_by, updated_by
) SELECT 
  'RGEKE72390722KLB07783',
  'E-Wheels',
  'li-ion',
  72,
  39,
  '18650',
  c.id,
  'delivered',
  '72v 39Ah. All cell ok, bms ok, Cell above 40 Ohms',
  4400.00,
  4400.00,
  uuid_generate_v4(),
  uuid_generate_v4()
FROM customers c WHERE c.name = 'Basheer' LIMIT 1;
