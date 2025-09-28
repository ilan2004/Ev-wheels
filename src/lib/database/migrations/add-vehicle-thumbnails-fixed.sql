-- Add thumbnail optimization columns to vehicle_cases table
-- This migration adds columns to store thumbnail URLs and improve performance

-- Add thumbnail_url column to store pre-generated thumbnail URLs
ALTER TABLE vehicle_cases 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add last_activity_at column for better sorting and filtering
ALTER TABLE vehicle_cases 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- Add priority column for urgency management
ALTER TABLE vehicle_cases 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5);

-- Add assigned_technician column for better assignment tracking (if not exists)
ALTER TABLE vehicle_cases 
ADD COLUMN IF NOT EXISTS assigned_technician UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_thumbnail ON vehicle_cases(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_last_activity ON vehicle_cases(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_cases_priority ON vehicle_cases(priority);

-- Update last_activity_at with current updated_at values
UPDATE vehicle_cases 
SET last_activity_at = COALESCE(updated_at, created_at)
WHERE last_activity_at IS NULL;

-- Create function to update last_activity_at without touching updated_by
CREATE OR REPLACE FUNCTION update_vehicle_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update last_activity_at, preserve updated_by from the original update
    NEW.last_activity_at = NOW();
    -- Ensure updated_by is not null (use existing value if not provided)
    IF NEW.updated_by IS NULL AND OLD.updated_by IS NOT NULL THEN
        NEW.updated_by = OLD.updated_by;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_activity_at
DROP TRIGGER IF EXISTS update_vehicle_last_activity_trigger ON vehicle_cases;
CREATE TRIGGER update_vehicle_last_activity_trigger
    BEFORE UPDATE ON vehicle_cases
    FOR EACH ROW EXECUTE FUNCTION update_vehicle_last_activity();

-- Function to update vehicle activity when attachment is added (without modifying updated_by)
CREATE OR REPLACE FUNCTION update_vehicle_activity_on_attachment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the vehicle's last activity when an attachment is added
    -- We use a direct update to avoid trigger cascades and preserve updated_by
    IF NEW.case_type = 'vehicle' AND NEW.case_id IS NOT NULL THEN
        UPDATE vehicle_cases 
        SET last_activity_at = NOW()
        WHERE id = NEW.case_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicle_attachment_activity_trigger ON ticket_attachments;
CREATE TRIGGER vehicle_attachment_activity_trigger
    AFTER INSERT ON ticket_attachments
    FOR EACH ROW EXECUTE FUNCTION update_vehicle_activity_on_attachment();

-- Function to generate thumbnail URL from first photo attachment
CREATE OR REPLACE FUNCTION generate_vehicle_thumbnail()
RETURNS TRIGGER AS $$
DECLARE
    first_photo RECORD;
BEGIN
    -- Only proceed if this is a vehicle photo attachment
    IF NEW.case_type = 'vehicle' AND NEW.attachment_type = 'photo' AND NEW.case_id IS NOT NULL THEN
        -- Check if vehicle already has a thumbnail
        SELECT thumbnail_url INTO first_photo 
        FROM vehicle_cases 
        WHERE id = NEW.case_id;
        
        -- If no thumbnail exists, use this photo
        IF first_photo.thumbnail_url IS NULL THEN
            UPDATE vehicle_cases 
            SET thumbnail_url = NEW.storage_path
            WHERE id = NEW.case_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_vehicle_thumbnail ON ticket_attachments;
CREATE TRIGGER auto_generate_vehicle_thumbnail
    AFTER INSERT ON ticket_attachments
    FOR EACH ROW EXECUTE FUNCTION generate_vehicle_thumbnail();
