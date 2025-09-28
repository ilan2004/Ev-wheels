-- E-Wheels Performance Optimization: Optimized Database Views
-- Phase 3: Database Query Optimization

-- Drop existing views if they exist
DROP VIEW IF EXISTS dashboard_kpis CASCADE;
DROP VIEW IF EXISTS battery_summary_stats CASCADE;
DROP VIEW IF EXISTS customer_activity_summary CASCADE;
DROP VIEW IF EXISTS monthly_delivery_trends CASCADE;

-- 1. Dashboard KPIs Materialized View
-- This view combines all KPI calculations into a single query
CREATE OR REPLACE VIEW dashboard_kpis AS
WITH 
  current_month AS (
    SELECT date_trunc('month', CURRENT_DATE) as month_start
  ),
  battery_stats AS (
    SELECT
      COUNT(*) as total_batteries,
      COUNT(*) FILTER (WHERE status IN ('received', 'diagnosed', 'in_progress')) as pending_repairs,
      COUNT(*) FILTER (WHERE status IN ('completed', 'delivered') AND delivered_date >= (SELECT month_start FROM current_month)) as completed_this_month,
      location_id
    FROM battery_records
    GROUP BY location_id
  ),
  customer_stats AS (
    SELECT
      COUNT(*) as active_customers,
      location_id
    FROM customers
    GROUP BY location_id
  ),
  ticket_stats AS (
    SELECT 
      jsonb_object_agg(status, status_count) as ticket_status_counts,
      location_id
    FROM (
      SELECT 
        status, 
        COUNT(*) as status_count,
        location_id
      FROM service_tickets 
      GROUP BY status, location_id
    ) ticket_counts
    GROUP BY location_id
  )
SELECT 
  COALESCE(bs.location_id, cs.location_id, ts.location_id) as location_id,
  COALESCE(bs.total_batteries, 0) as total_batteries,
  COALESCE(bs.pending_repairs, 0) as pending_repairs,
  COALESCE(bs.completed_this_month, 0) as completed_this_month,
  COALESCE(cs.active_customers, 0) as active_customers,
  COALESCE(ts.ticket_status_counts, '{}'::jsonb) as ticket_status
FROM battery_stats bs
FULL OUTER JOIN customer_stats cs ON bs.location_id = cs.location_id
FULL OUTER JOIN ticket_stats ts ON COALESCE(bs.location_id, cs.location_id) = ts.location_id;

-- 2. Battery Summary Stats View
-- Optimized view for battery listing with customer info
CREATE OR REPLACE VIEW battery_summary_stats AS
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
  br.location_id,
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
-- Optimized view for customer metrics with battery counts
CREATE OR REPLACE VIEW customer_activity_summary AS
SELECT 
  c.id,
  c.name,
  c.contact,
  c.email,
  c.address,
  c.created_at,
  c.location_id,
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
GROUP BY c.id, c.name, c.contact, c.email, c.address, c.created_at, c.location_id;

-- 4. Monthly Delivery Trends View
-- Pre-calculated monthly delivery statistics
CREATE OR REPLACE VIEW monthly_delivery_trends AS
WITH monthly_data AS (
  SELECT 
    date_trunc('month', delivered_date) as month,
    location_id,
    COUNT(*) as deliveries,
    SUM(COALESCE(final_cost, estimated_cost, 0)) as revenue,
    AVG(COALESCE(final_cost, estimated_cost, 0)) as avg_cost_per_battery
  FROM battery_records 
  WHERE delivered_date IS NOT NULL 
    AND delivered_date >= (CURRENT_DATE - INTERVAL '12 months')
  GROUP BY date_trunc('month', delivered_date), location_id
)
SELECT 
  month,
  location_id,
  deliveries,
  revenue,
  avg_cost_per_battery,
  -- Calculate month-over-month growth
  LAG(deliveries, 1) OVER (PARTITION BY location_id ORDER BY month) as prev_month_deliveries,
  LAG(revenue, 1) OVER (PARTITION BY location_id ORDER BY month) as prev_month_revenue,
  -- Growth percentages
  CASE 
    WHEN LAG(deliveries, 1) OVER (PARTITION BY location_id ORDER BY month) > 0 THEN
      ROUND(((deliveries::decimal - LAG(deliveries, 1) OVER (PARTITION BY location_id ORDER BY month)) / 
             LAG(deliveries, 1) OVER (PARTITION BY location_id ORDER BY month)) * 100, 2)
    ELSE NULL
  END as delivery_growth_percent,
  CASE 
    WHEN LAG(revenue, 1) OVER (PARTITION BY location_id ORDER BY month) > 0 THEN
      ROUND(((revenue - LAG(revenue, 1) OVER (PARTITION BY location_id ORDER BY month)) / 
             LAG(revenue, 1) OVER (PARTITION BY location_id ORDER BY month)) * 100, 2)
    ELSE NULL
  END as revenue_growth_percent
FROM monthly_data
ORDER BY location_id, month DESC;

-- 5. Weekly Delivery Trends View (for charts)
CREATE OR REPLACE VIEW weekly_delivery_trends AS
WITH weekly_data AS (
  SELECT 
    date_trunc('week', delivered_date) as week_start,
    location_id,
    COUNT(*) as deliveries
  FROM battery_records 
  WHERE delivered_date IS NOT NULL 
    AND delivered_date >= (CURRENT_DATE - INTERVAL '12 weeks')
  GROUP BY date_trunc('week', delivered_date), location_id
),
-- Generate complete week series to fill gaps
week_series AS (
  SELECT 
    generate_series(
      date_trunc('week', CURRENT_DATE - INTERVAL '12 weeks'),
      date_trunc('week', CURRENT_DATE),
      INTERVAL '1 week'
    ) as week_start
)
SELECT 
  ws.week_start,
  COALESCE(wd.location_id, 'default') as location_id,
  COALESCE(wd.deliveries, 0) as deliveries
FROM week_series ws
LEFT JOIN weekly_data wd ON ws.week_start = wd.week_start
ORDER BY week_start;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_battery_records_status_location ON battery_records(status, location_id);
CREATE INDEX IF NOT EXISTS idx_battery_records_delivered_date ON battery_records(delivered_date) WHERE delivered_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_battery_records_received_date ON battery_records(received_date) WHERE received_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers(location_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status_location ON service_tickets(status, location_id);

-- Grant permissions (adjust based on your RLS policies)
-- These views should inherit the same RLS policies as the underlying tables

COMMENT ON VIEW dashboard_kpis IS 'Optimized view combining all dashboard KPI calculations into single query';
COMMENT ON VIEW battery_summary_stats IS 'Pre-joined battery and customer data with calculated metrics';
COMMENT ON VIEW customer_activity_summary IS 'Customer metrics with aggregated battery statistics';
COMMENT ON VIEW monthly_delivery_trends IS 'Pre-calculated monthly delivery trends with growth metrics';
COMMENT ON VIEW weekly_delivery_trends IS 'Weekly delivery data for chart visualization with gap filling';
