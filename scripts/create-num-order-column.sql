-- Criar coluna num_order na tabela atendimentos
ALTER TABLE atendimentos ADD COLUMN num_order INTEGER;

-- Criar sequência para numeração automática
CREATE SEQUENCE IF NOT EXISTS atendimentos_num_order_seq START 0;

-- Atualizar registros existentes com numeração sequencial começando do 0
UPDATE atendimentos 
SET num_order = (
  SELECT ROW_NUMBER() OVER (ORDER BY created_at) - 1
  FROM (SELECT id, created_at FROM atendimentos) sub
  WHERE sub.id = atendimentos.id
);

-- Definir valor padrão para novos registros
ALTER TABLE atendimentos ALTER COLUMN num_order SET DEFAULT nextval('atendimentos_num_order_seq');

-- Garantir que a sequência continue do próximo número disponível
SELECT setval('atendimentos_num_order_seq', COALESCE((SELECT MAX(num_order) FROM atendimentos), -1) + 1, false);

-- Adicionar constraint para garantir que num_order seja único e não nulo
ALTER TABLE atendimentos ALTER COLUMN num_order SET NOT NULL;
ALTER TABLE atendimentos ADD CONSTRAINT unique_num_order UNIQUE (num_order);

-- Adicionar constraint para limitar o range de 0 a 99999
ALTER TABLE atendimentos ADD CONSTRAINT check_num_order_range CHECK (num_order >= 0 AND num_order <= 99999);
