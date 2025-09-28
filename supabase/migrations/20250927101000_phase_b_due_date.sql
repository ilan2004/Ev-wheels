-- Phase B: Manager Dashboard Kanban prerequisites
-- Add due_date to service_tickets and index it for filtering/ordering

alter table if exists public.service_tickets
  add column if not exists due_date timestamptz;

create index if not exists idx_service_tickets_due_date on public.service_tickets(due_date);

