-- Add instalador column to obras table
ALTER TABLE obras ADD COLUMN IF NOT EXISTS instalador text;

-- Update existing records to have instalador as atendente if needed
UPDATE obras SET instalador = atendente WHERE instalador IS NULL;
