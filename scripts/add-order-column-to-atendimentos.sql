-- Add order column to atendimentos table and populate it
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Update existing records with order numbers starting from 0
WITH ordered_atendimentos AS (
  SELECT id, (ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1) as row_num
  FROM atendimentos
)
UPDATE atendimentos 
SET "order" = ordered_atendimentos.row_num
FROM ordered_atendimentos
WHERE atendimentos.id = ordered_atendimentos.id;

-- Set default value for future records to continue from max + 1
ALTER TABLE atendimentos ALTER COLUMN "order" SET DEFAULT (
  COALESCE((SELECT MAX("order") FROM atendimentos), -1) + 1
);
