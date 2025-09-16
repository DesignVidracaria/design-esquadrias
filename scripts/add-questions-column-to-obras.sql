-- Add questions column to obras table to store dynamic questions
ALTER TABLE obras ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb;

-- Update existing obras with default questions structure
UPDATE obras 
SET questions = '[
  {"key": "material_entregue", "text": "Material foi entregue no local?"},
  {"key": "cliente_confirmou_medidas", "text": "Cliente confirmou as medidas?"},
  {"key": "local_preparado", "text": "Local está preparado para instalação?"},
  {"key": "ferramentas_disponiveis", "text": "Ferramentas necessárias estão disponíveis?"},
  {"key": "cliente_aprovou_projeto", "text": "Cliente aprovou o projeto final?"},
  {"key": "documentacao_completa", "text": "Documentação está completa?"},
  {"key": "prazo_confirmado", "text": "Prazo de entrega foi confirmado?"}
]'::jsonb
WHERE questions IS NULL OR questions = '[]'::jsonb;
