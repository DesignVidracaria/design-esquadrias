-- Update the obras table structure to match the new form fields
ALTER TABLE obras 
DROP COLUMN IF EXISTS titulo,
DROP COLUMN IF EXISTS descricao,
DROP COLUMN IF EXISTS endereco,
DROP COLUMN IF EXISTS valor,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS imagem_principal;

ALTER TABLE obras 
ADD COLUMN IF NOT EXISTS numero_orcamento TEXT,
ADD COLUMN IF NOT EXISTS instalador TEXT,
ADD COLUMN IF NOT EXISTS questions_answers JSONB DEFAULT '{}';

-- Update any existing records to have the new structure
UPDATE obras SET 
  numero_orcamento = COALESCE(titulo, ''),
  instalador = COALESCE(endereco, '')
WHERE numero_orcamento IS NULL OR instalador IS NULL;
