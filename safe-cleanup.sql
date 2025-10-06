-- Safe cleanup script - only deletes from tables that exist
-- First, let's see what tables we have:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Safe cleanup - only runs if tables exist
DO $$
BEGIN
    -- Clear history tables if they exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_ticket_history') THEN
        DELETE FROM public.service_ticket_history;
        RAISE NOTICE 'Cleared service_ticket_history';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_status_history') THEN
        DELETE FROM public.vehicle_status_history;
        RAISE NOTICE 'Cleared vehicle_status_history';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'battery_status_history') THEN
        DELETE FROM public.battery_status_history;
        RAISE NOTICE 'Cleared battery_status_history';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers_audit') THEN
        DELETE FROM public.customers_audit;
        RAISE NOTICE 'Cleared customers_audit';
    END IF;

    -- Clear attachment data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_attachments') THEN
        DELETE FROM public.ticket_attachments;
        RAISE NOTICE 'Cleared ticket_attachments';
    END IF;

    -- Clear service data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_cases') THEN
        DELETE FROM public.vehicle_cases;
        RAISE NOTICE 'Cleared vehicle_cases';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_tickets') THEN
        DELETE FROM public.service_tickets;
        RAISE NOTICE 'Cleared service_tickets';
    END IF;

    -- Clear battery diagnostics
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'technical_diagnostics') THEN
        DELETE FROM public.technical_diagnostics;
        RAISE NOTICE 'Cleared technical_diagnostics';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'repair_estimates') THEN
        DELETE FROM public.repair_estimates;
        RAISE NOTICE 'Cleared repair_estimates';
    END IF;

    -- Clear main data tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'battery_records') THEN
        DELETE FROM public.battery_records;
        RAISE NOTICE 'Cleared battery_records';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        DELETE FROM public.customers;
        RAISE NOTICE 'Cleared customers';
    END IF;

    -- Clear location data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_locations') THEN
        DELETE FROM public.user_locations;
        RAISE NOTICE 'Cleared user_locations';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
        DELETE FROM public.locations;
        RAISE NOTICE 'Cleared locations';
    END IF;

    -- Clear profiles
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DELETE FROM public.profiles;
        RAISE NOTICE 'Cleared profiles';
    END IF;

    -- Clear any other data tables that might exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        DELETE FROM public.quotes;
        RAISE NOTICE 'Cleared quotes';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        DELETE FROM public.quote_items;
        RAISE NOTICE 'Cleared quote_items';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoices') THEN
        DELETE FROM public.invoices;
        RAISE NOTICE 'Cleared invoices';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invoice_items') THEN
        DELETE FROM public.invoice_items;
        RAISE NOTICE 'Cleared invoice_items';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        DELETE FROM public.payments;
        RAISE NOTICE 'Cleared payments';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_movements') THEN
        DELETE FROM public.inventory_movements;
        RAISE NOTICE 'Cleared inventory_movements';
    END IF;

    RAISE NOTICE 'Database cleanup completed successfully!';
END $$;
