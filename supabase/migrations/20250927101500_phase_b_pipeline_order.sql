-- Phase B (cont): Add pipeline_order for Kanban intra-column ordering
alter table if exists public.service_tickets
  add column if not exists pipeline_order bigint;

-- Skipping initialization to avoid touching legacy rows with null updated_by
-- Existing rows will naturally sort by created_at; new moves will set pipeline_order

create index if not exists idx_service_tickets_status_order on public.service_tickets(status, pipeline_order desc);

