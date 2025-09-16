-- Update the checklist_status column to use the new JSONB structure
UPDATE obras 
SET checklist_status = jsonb_build_object(
  'material_entregue', false,
  'cliente_confirmou_medidas', false,
  'local_preparado', false,
  'ferramentas_disponiveis', false,
  'cliente_aprovou_projeto', false,
  'documentacao_completa', false,
  'prazo_confirmado', false
)
WHERE checklist_status IS NULL OR checklist_status = '{}';

-- Ensure the column exists and is of type JSONB
ALTER TABLE obras 
ALTER COLUMN checklist_status TYPE JSONB USING checklist_status::JSONB;

-- Set default value for new records
ALTER TABLE obras 
ALTER COLUMN checklist_status SET DEFAULT '{
  "material_entregue": false,
  "cliente_confirmou_medidas": false,
  "local_preparado": false,
  "ferramentas_disponiveis": false,
  "cliente_aprovou_projeto": false,
  "documentacao_completa": false,
  "prazo_confirmado": false
}'::JSONB;
