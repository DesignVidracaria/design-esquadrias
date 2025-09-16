-- Drop the questions column from obras table since functionality moved to checklist_status
ALTER TABLE obras DROP COLUMN IF EXISTS questions;
