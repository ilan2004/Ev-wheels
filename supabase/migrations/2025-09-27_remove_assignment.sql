-- Migration: Remove assignment system from service tickets
-- Date: 2025-09-27
-- Purpose:
--  1) Convert any existing 'assigned' tickets to 'triaged'
--  2) Remove 'assigned' from service_ticket_status enum
--  3) Drop assigned_to column and its index
--  4) Update history trigger to stop recording 'assigned' actions

BEGIN;

-- 1) Update existing rows that used the 'assigned' status
UPDATE service_tickets SET status = 'triaged' WHERE status = 'assigned';

-- 2) Recreate enum without 'assigned'
-- Postgres enums do not support DROP VALUE; we must recreate the type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'service_ticket_status'
  ) THEN
    -- Create a new enum without the 'assigned' value
    CREATE TYPE service_ticket_status_new AS ENUM (
      'reported',
      'triaged',
      'in_progress',
      'completed',
      'delivered',
      'closed',
      'cancelled',
      'on_hold',
      'waiting_approval'
    );

    -- Change column types to the new enum
    ALTER TABLE service_tickets
      ALTER COLUMN status TYPE service_ticket_status_new
      USING status::text::service_ticket_status_new;

    -- Swap types: rename old to _old, new to original name
    ALTER TYPE service_ticket_status RENAME TO service_ticket_status_old;
    ALTER TYPE service_ticket_status_new RENAME TO service_ticket_status;

    -- Drop the old type
    DROP TYPE service_ticket_status_old;
  END IF;
END$$;

-- 3) Drop assigned_to column and related index if they still exist
DROP INDEX IF EXISTS idx_service_tickets_assigned_to;
ALTER TABLE service_tickets DROP COLUMN IF EXISTS assigned_to;

-- 4) Update the service ticket history trigger function to remove 'assigned' action branch
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
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            action_type := 'status_changed';
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
            WHEN action_type = 'status_changed' THEN 'Ticket status updated'
            ELSE 'Ticket updated'
        END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMIT;

