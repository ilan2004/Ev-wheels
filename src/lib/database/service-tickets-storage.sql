-- Service Tickets - Supabase Storage buckets (Phase 0)
-- Creates the private buckets used for photos and audio

-- Create buckets if they don't already exist
-- Create buckets if they don't already exist (version-safe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-photos', 'media-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-audio', 'media-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Optional: you can create folder prefixes by uploading at those paths
-- e.g., media-photos/intakes/{ticket_id}/..., batteries/{battery_id}/..., vehicles/{vehicle_case_id}/...

