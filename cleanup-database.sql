-- ========================================
-- PRODUCTION READY DATABASE CLEANUP
-- ========================================
-- This script removes ALL existing data from your E-Wheels BMS database
-- while preserving the complete schema structure.
-- 
-- Run this before deploying to production for your client.
-- ========================================

-- Disable RLS temporarily to ensure complete cleanup
SET session_replication_role = replica;

-- =================
-- CLEAR ALL DATA
-- =================

-- Clear all history and audit tables first (to avoid FK constraints)
DELETE FROM public.service_ticket_history;
DELETE FROM public.vehicle_status_history;
DELETE FROM public.battery_status_history;
DELETE FROM public.customers_audit;

-- Clear all attachment and file-related data
DELETE FROM public.ticket_attachments;

-- Clear service-related data
DELETE FROM public.vehicle_cases;
DELETE FROM public.service_tickets;

-- Clear battery diagnostics and estimates
DELETE FROM public.technical_diagnostics;
DELETE FROM public.repair_estimates;

-- Clear battery records
DELETE FROM public.battery_records;

-- Clear customer data
DELETE FROM public.customers;

-- Clear location assignments and locations
DELETE FROM public.user_locations;
DELETE FROM public.locations;

-- Clear user profiles (preserves auth.users which is managed by Supabase Auth)
DELETE FROM public.profiles;

-- =================
-- RESET SEQUENCES
-- =================

-- Reset any sequences to start fresh (if you have any custom sequences)
-- Note: Most IDs use uuid_generate_v4() so no sequences to reset

-- =================
-- CLEAN UP STORAGE
-- =================

-- Note: This script doesn't delete files from Supabase Storage buckets
-- You may need to manually clear storage buckets in the Supabase dashboard if you have uploaded files

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- =================
-- VERIFICATION QUERIES
-- =================

-- Run these to verify cleanup (should all return 0)
SELECT 'customers' as table_name, COUNT(*) as record_count FROM public.customers
UNION ALL
SELECT 'battery_records', COUNT(*) FROM public.battery_records
UNION ALL
SELECT 'service_tickets', COUNT(*) FROM public.service_tickets
UNION ALL
SELECT 'vehicle_cases', COUNT(*) FROM public.vehicle_cases
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'locations', COUNT(*) FROM public.locations
UNION ALL
SELECT 'user_locations', COUNT(*) FROM public.user_locations
UNION ALL
SELECT 'ticket_attachments', COUNT(*) FROM public.ticket_attachments
UNION ALL
SELECT 'battery_status_history', COUNT(*) FROM public.battery_status_history
UNION ALL
SELECT 'vehicle_status_history', COUNT(*) FROM public.vehicle_status_history
UNION ALL
SELECT 'service_ticket_history', COUNT(*) FROM public.service_ticket_history
UNION ALL
SELECT 'technical_diagnostics', COUNT(*) FROM public.technical_diagnostics
UNION ALL
SELECT 'repair_estimates', COUNT(*) FROM public.repair_estimates
UNION ALL
SELECT 'customers_audit', COUNT(*) FROM public.customers_audit;

-- =================
-- SUCCESS MESSAGE
-- =================

SELECT 'Database cleanup completed successfully!' as status,
       'All tables have been cleared and are ready for production use.' as message;
