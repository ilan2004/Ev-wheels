-- Migration: Performance Optimization Views and Indexes
-- Phase 3: Database Query Optimization
-- Created: 2024-09-28
-- Description: Creates optimized database views and indexes for improved query performance

-- Begin transaction
BEGIN;

-- Check if this migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dashboard_kpis') THEN
        RAISE NOTICE 'Performance optimization views already exist. Skipping migration.';
        ROLLBACK;
        RETURN;
    END IF;
END
$$;

-- Create optimized views (from optimized-views.sql)

-- 1. Dashboard KPIs Materialized View
CREATE VIEW dashboard_kpis AS
WITH 
  current_month AS (
    SELECT date_trunc('month', CURRENT_DATE) as month_start
  ),
  battery_stats AS (
    SELECT
      COUNT(*) as total_batteries,
      COUNT(*) FILTER (WHERE status IN ('received', 'diagnosed', 'in_progress')) as pending_repairs,
      COUNT(*) FILTER (WHERE status IN ('completed', 'delivered') AND delivered_date >= (SELECT month_start FROM current_month)) as completed_this_month,
      COALESCE(location_id, 'default') as location_id
    FROM battery_records
    GROUP BY COALESCE(location_id, 'default')
  ),
  customer_stats AS (
    SELECT
      COUNT(*) as active_customers,
      COALESCE(location_id, 'default') as location_id
    FROM customers
    GROUP BY COALESCE(location_id, 'default')
  ),
  ticket_stats AS (
    SELECT 
      jsonb_object_agg(status, status_count) as ticket_status_counts,
      COALESCE(location_id, 'default') as location_id
    FROM (
      SELECT 
        status, 
        COUNT(*) as status_count,
        COALESCE(location_id, 'default') as location_id
      FROM service_tickets 
      GROUP BY status, COALESCE(location_id, 'default')
    ) ticket_counts
    GROUP BY COALESCE(location_id, 'default')
  )
SELECT 
  COALESCE(bs.location_id, cs.location_id, ts.location_id, 'default') as location_id,
  COALESCE(bs.total_batteries, 0) as total_batteries,
  COALESCE(bs.pending_repairs, 0) as pending_repairs,
  COALESCE(bs.completed_this_month, 0) as completed_this_month,
  COALESCE(cs.active_customers, 0) as active_customers,
  COALESCE(ts.ticket_status_counts, '{}'::jsonb) as ticket_status
FROM battery_stats bs
FULL OUTER JOIN customer_stats cs ON bs.location_id = cs.location_id
FULL OUTER JOIN ticket_stats ts ON COALESCE(bs.location_id, cs.location_id) = ts.location_id;

-- 2. Battery Summary Stats View
CREATE VIEW battery_summary_stats AS
SELECT 
  br.id,
  br.serial_number,
  br.brand,
  br.model,
  br.battery_type,
  br.voltage,
  br.capacity,
  br.customer_id,
  c.name as customer_name,
  c.contact as customer_contact,
  br.status,
  br.received_date,
  br.delivered_date,
  br.estimated_cost,
  br.final_cost,
  COALESCE(br.location_id, 'default') as location_id,
  br.created_at,
  br.updated_at,
  -- Performance indicators
  CASE 
    WHEN br.status IN ('received', 'diagnosed', 'in_progress') THEN 'pending'
    WHEN br.status IN ('completed', 'delivered') THEN 'completed'
    ELSE 'other'
  END as status_category,
  -- Days since received
  CASE 
    WHEN br.received_date IS NOT NULL THEN 
      EXTRACT(DAY FROM (CURRENT_DATE - br.received_date::date))
    ELSE NULL
  END as days_since_received,
  -- Delivery status
  CASE 
    WHEN br.delivered_date IS NOT NULL THEN 'delivered'
    WHEN br.status = 'completed' AND br.delivered_date IS NULL THEN 'ready'
    ELSE 'in_progress'
  END as delivery_status
FROM battery_records br
LEFT JOIN customers c ON br.customer_id = c.id;

-- 3. Customer Activity Summary View
CREATE VIEW customer_activity_summary AS
SELECT 
  c.id,
  c.name,
  c.contact,
  c.email,
  c.address,
  c.created_at,
  COALESCE(c.location_id, 'default') as location_id,
  -- Battery counts
  COUNT(br.id) as total_batteries,
  COUNT(br.id) FILTER (WHERE br.status IN ('received', 'diagnosed', 'in_progress')) as pending_batteries,
  COUNT(br.id) FILTER (WHERE br.status IN ('completed', 'delivered')) as completed_batteries,
  -- Financial metrics
  SUM(COALESCE(br.final_cost, br.estimated_cost, 0)) as total_revenue,
  AVG(COALESCE(br.final_cost, br.estimated_cost, 0)) as avg_battery_cost,
  -- Recent activity
  MAX(br.received_date) as last_battery_received,
  MAX(br.delivered_date) as last_delivery
FROM customers c
LEFT JOIN battery_records br ON c.id = br.customer_id
GROUP BY c.id, c.name, c.contact, c.email, c.address, c.created_at, COALESCE(c.location_id, 'default');

-- 4. Weekly Delivery Trends View (for charts)
CREATE VIEW weekly_delivery_trends AS
WITH weekly_data AS (
  SELECT 
    date_trunc('week', delivered_date) as week_start,
    COALESCE(location_id, 'default') as location_id,
    COUNT(*) as deliveries
  FROM battery_records 
  WHERE delivered_date IS NOT NULL 
    AND delivered_date >= (CURRENT_DATE - INTERVAL '12 weeks')
  GROUP BY date_trunc('week', delivered_date), COALESCE(location_id, 'default')
),
-- Generate complete week series to fill gaps
week_series AS (
  SELECT 
    generate_series(
      date_trunc('week', CURRENT_DATE - INTERVAL '12 weeks'),
      date_trunc('week', CURRENT_DATE),
      INTERVAL '1 week'
    ) as week_start
),
locations AS (
  SELECT DISTINCT COALESCE(location_id, 'default') as location_id FROM battery_records
  UNION SELECT 'default'
)
SELECT 
  ws.week_start,
  l.location_id,
  COALESCE(wd.deliveries, 0) as deliveries
FROM week_series ws
CROSS JOIN locations l
LEFT JOIN weekly_data wd ON ws.week_start = wd.week_start AND l.location_id = wd.location_id
ORDER BY l.location_id, ws.week_start;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_battery_records_status_location ON battery_records(status, COALESCE(location_id, 'default'));
CREATE INDEX IF NOT EXISTS idx_battery_records_delivered_date ON battery_records(delivered_date) WHERE delivered_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_battery_records_received_date ON battery_records(received_date) WHERE received_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers(COALESCE(location_id, 'default'));
CREATE INDEX IF NOT EXISTS idx_service_tickets_status_location ON service_tickets(status, COALESCE(location_id, 'default'));

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_battery_records_customer_status ON battery_records(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_battery_records_brand_status ON battery_records(brand, status);
CREATE INDEX IF NOT EXISTS idx_battery_records_serial_search ON battery_records(serial_number);

-- Add comments
COMMENT ON VIEW dashboard_kpis IS 'Optimized view combining all dashboard KPI calculations into single query';
COMMENT ON VIEW battery_summary_stats IS 'Pre-joined battery and customer data with calculated metrics';
COMMENT ON VIEW customer_activity_summary IS 'Customer metrics with aggregated battery statistics';
COMMENT ON VIEW weekly_delivery_trends IS 'Weekly delivery data for chart visualization with gap filling';

-- Log successful migration
INSERT INTO schema_migrations (version, applied_at) VALUES ('003_performance_optimization_views', NOW())
ON CONFLICT (version) DO NOTHING;

-- Commit transaction
COMMIT;

-- Analyze tables for better query planning
ANALYZE battery_records;
ANALYZE customers;
ANALYZE service_tickets;
