-- Add checklist_status column to obras table
ALTER TABLE obras ADD COLUMN IF NOT EXISTS checklist_status JSONB DEFAULT '{}';

-- Update existing records to have empty checklist_status
UPDATE obras SET checklist_status = '{}' WHERE checklist_status IS NULL;

-- Add comment to the column
COMMENT ON COLUMN obras.checklist_status IS 'Stores the checklist status as JSON with question indices as keys and boolean values';
