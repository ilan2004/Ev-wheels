-- Simple cleanup script - execute this in Supabase SQL Editor
-- Clear all history and audit tables first
DELETE FROM public.service_ticket_history WHERE true;
DELETE FROM public.vehicle_status_history WHERE true;
DELETE FROM public.battery_status_history WHERE true;
DELETE FROM public.customers_audit WHERE true;

-- Clear attachment data
DELETE FROM public.ticket_attachments WHERE true;

-- Clear service data
DELETE FROM public.vehicle_cases WHERE true;
DELETE FROM public.service_tickets WHERE true;

-- Clear battery diagnostics
DELETE FROM public.technical_diagnostics WHERE true;
DELETE FROM public.repair_estimates WHERE true;

-- Clear main data tables
DELETE FROM public.battery_records WHERE true;
DELETE FROM public.customers WHERE true;

-- Clear location data
DELETE FROM public.user_locations WHERE true;
DELETE FROM public.locations WHERE true;

-- Clear profiles
DELETE FROM public.profiles WHERE true;
