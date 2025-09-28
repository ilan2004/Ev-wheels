-- Phase 4: Vehicle Analytics Database Migration
-- Add required columns and indexes for dashboard functionality

-- =========================================
-- 1. Add new columns to vehicle_cases table
-- =========================================

-- Add priority column (1=Low, 2=Medium, 3=High, 4=Critical)
ALTER TABLE vehicle_cases 
ADD COLUMN priority INTEGER DEFAULT 3 
CHECK (priority >= 1 AND priority <= 4);

-- Add last activity timestamp for performance tracking
ALTER TABLE vehicle_cases 
ADD COLUMN last_activity_at TIMESTAMP DEFAULT NOW();

-- Add SLA deadline for automated alert generation
ALTER TABLE vehicle_cases 
ADD COLUMN sla_deadline TIMESTAMP;

-- Add thumbnail URL for faster image loading
ALTER TABLE vehicle_cases 
ADD COLUMN thumbnail_url TEXT;

-- Add thumbnail generation timestamp
ALTER TABLE vehicle_cases 
ADD COLUMN thumbnail_generated_at TIMESTAMP;

-- =========================================
-- 2. Create performance indexes
-- =========================================

-- Index for technician assignment queries (dashboard analytics)
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_assigned_technician 
ON vehicle_cases(assigned_technician) 
WHERE assigned_technician IS NOT NULL;

-- Composite index for status and date filtering (most common dashboard query)
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_status_received_date 
ON vehicle_cases(status, received_date DESC);

-- Index for customer and status combination (customer analytics)
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_customer_status 
ON vehicle_cases(customer_id, status);

-- Index for overdue cases detection
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_overdue 
ON vehicle_cases(received_date, status) 
WHERE status NOT IN ('delivered', 'cancelled', 'completed');

-- Index for SLA monitoring
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_sla_deadline 
ON vehicle_cases(sla_deadline) 
WHERE sla_deadline IS NOT NULL AND status NOT IN ('delivered', 'cancelled');

-- Index for recent activity tracking
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_last_activity 
ON vehicle_cases(last_activity_at DESC);

-- Index for priority-based sorting
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_priority 
ON vehicle_cases(priority DESC, received_date DESC);

-- =========================================
-- 3. Create dashboard analytics views
-- =========================================

-- View for quick dashboard metrics
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
  COUNT(*) FILTER (WHERE status NOT IN ('delivered', 'cancelled')) as total_active_vehicles,
  COUNT(*) FILTER (WHERE status IN ('completed', 'ready_for_pickup')) as ready_for_pickup,
  COUNT(*) FILTER (WHERE received_date >= CURRENT_DATE) as todays_arrivals,
  COUNT(*) FILTER (WHERE 
    received_date < (CURRENT_DATE - INTERVAL '7 days') 
    AND status NOT IN ('delivered', 'cancelled', 'completed')
  ) as overdue_cases,
  COUNT(*) FILTER (WHERE assigned_technician IS NULL AND status NOT IN ('delivered', 'cancelled')) as unassigned_cases,
  COUNT(DISTINCT assigned_technician) FILTER (WHERE assigned_technician IS NOT NULL) as active_technicians
FROM vehicle_cases
WHERE created_at >= (CURRENT_DATE - INTERVAL '90 days'); -- Last 90 days for performance

-- View for technician workload analysis
CREATE OR REPLACE VIEW technician_workload AS
SELECT 
  assigned_technician,
  COUNT(*) FILTER (WHERE status NOT IN ('delivered', 'cancelled')) as active_cases,
  COUNT(*) FILTER (WHERE status = 'delivered') as completed_cases,
  AVG(
    CASE 
      WHEN delivered_date IS NOT NULL AND received_date IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (delivered_date - received_date)) / 86400.0 
      ELSE NULL 
    END
  ) as avg_turnaround_days,
  MAX(last_activity_at) as last_activity
FROM vehicle_cases
WHERE 
  assigned_technician IS NOT NULL 
  AND created_at >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY assigned_technician;

-- View for status distribution
CREATE OR REPLACE VIEW status_distribution AS
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM vehicle_cases
WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY status
ORDER BY count DESC;

-- =========================================
-- 4. Update existing records
-- =========================================

-- Set last_activity_at for existing records
UPDATE vehicle_cases 
SET last_activity_at = COALESCE(updated_at, created_at)
WHERE last_activity_at IS NULL;

-- Set default SLA deadline (7 days from received date for non-completed cases)
UPDATE vehicle_cases 
SET sla_deadline = received_date + INTERVAL '7 days'
WHERE 
  sla_deadline IS NULL 
  AND status NOT IN ('delivered', 'cancelled') 
  AND received_date IS NOT NULL;

-- =========================================
-- 5. Create triggers for automatic updates
-- =========================================

-- Trigger function to update last_activity_at on any update
CREATE OR REPLACE FUNCTION update_last_activity_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_last_activity ON vehicle_cases;
CREATE TRIGGER trigger_update_last_activity
  BEFORE UPDATE ON vehicle_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity_at();

-- Trigger function to set default SLA deadline on insert
CREATE OR REPLACE FUNCTION set_default_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_deadline IS NULL AND NEW.received_date IS NOT NULL THEN
    -- Set SLA deadline based on priority
    CASE NEW.priority
      WHEN 4 THEN NEW.sla_deadline = NEW.received_date + INTERVAL '1 day'; -- Critical: 24 hours
      WHEN 3 THEN NEW.sla_deadline = NEW.received_date + INTERVAL '3 days'; -- High: 3 days
      WHEN 2 THEN NEW.sla_deadline = NEW.received_date + INTERVAL '7 days'; -- Medium: 7 days
      ELSE NEW.sla_deadline = NEW.received_date + INTERVAL '14 days'; -- Low: 14 days
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_sla_deadline ON vehicle_cases;
CREATE TRIGGER trigger_set_sla_deadline
  BEFORE INSERT ON vehicle_cases
  FOR EACH ROW
  EXECUTE FUNCTION set_default_sla_deadline();

-- =========================================
-- 6. Add comments for documentation
-- =========================================

COMMENT ON COLUMN vehicle_cases.priority IS 'Priority level: 1=Low, 2=Medium, 3=High, 4=Critical';
COMMENT ON COLUMN vehicle_cases.last_activity_at IS 'Timestamp of last update for activity tracking';
COMMENT ON COLUMN vehicle_cases.sla_deadline IS 'Service level agreement deadline for completion';
COMMENT ON COLUMN vehicle_cases.thumbnail_url IS 'URL to generated thumbnail image';
COMMENT ON COLUMN vehicle_cases.thumbnail_generated_at IS 'When thumbnail was last generated';

COMMENT ON INDEX idx_vehicle_cases_assigned_technician IS 'Performance index for technician workload queries';
COMMENT ON INDEX idx_vehicle_cases_status_received_date IS 'Composite index for status and date filtering';
COMMENT ON INDEX idx_vehicle_cases_customer_status IS 'Index for customer analytics queries';
COMMENT ON INDEX idx_vehicle_cases_overdue IS 'Index for efficient overdue case detection';
COMMENT ON INDEX idx_vehicle_cases_sla_deadline IS 'Index for SLA monitoring and alerts';
COMMENT ON INDEX idx_vehicle_cases_last_activity IS 'Index for recent activity tracking';
COMMENT ON INDEX idx_vehicle_cases_priority IS 'Index for priority-based sorting';

COMMENT ON VIEW dashboard_metrics IS 'Quick dashboard metrics for vehicle analytics';
COMMENT ON VIEW technician_workload IS 'Technician workload and performance analysis';
COMMENT ON VIEW status_distribution IS 'Vehicle status distribution for charts';

-- =========================================
-- 7. Grant necessary permissions
-- =========================================

-- Grant SELECT permissions on views to application users
GRANT SELECT ON dashboard_metrics TO PUBLIC;
GRANT SELECT ON technician_workload TO PUBLIC;
GRANT SELECT ON status_distribution TO PUBLIC;

-- =========================================
-- 8. Validation queries
-- =========================================

-- Verify new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'vehicle_cases' 
  AND column_name IN ('priority', 'last_activity_at', 'sla_deadline', 'thumbnail_url', 'thumbnail_generated_at')
ORDER BY column_name;

-- Verify indexes were created
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'vehicle_cases' 
  AND indexname LIKE 'idx_vehicle_cases_%'
ORDER BY indexname;

-- Verify views were created
SELECT 
  viewname,
  definition
FROM pg_views 
WHERE viewname IN ('dashboard_metrics', 'technician_workload', 'status_distribution');

-- Test dashboard metrics view
SELECT * FROM dashboard_metrics;

-- Test a sample query with new indexes (should be fast)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
  status,
  COUNT(*),
  COUNT(*) FILTER (WHERE priority >= 3) as high_priority_count
FROM vehicle_cases 
WHERE 
  received_date >= CURRENT_DATE - INTERVAL '30 days'
  AND assigned_technician IS NOT NULL
GROUP BY status;

COMMIT;
