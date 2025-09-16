-- Remove foreign key constraints que estão causando problemas
-- Permite que clientes e arquitetos sejam criados independentemente

-- Remove foreign key constraint da tabela clientes se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clientes_id_fkey' 
        AND table_name = 'clientes'
    ) THEN
        ALTER TABLE clientes DROP CONSTRAINT clientes_id_fkey;
    END IF;
END $$;

-- Remove foreign key constraint da tabela arquitetos se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'arquitetos_id_fkey' 
        AND table_name = 'arquitetos'
    ) THEN
        ALTER TABLE arquitetos DROP CONSTRAINT arquitetos_id_fkey;
    END IF;
END $$;

-- Adiciona valores padrão para gerar UUIDs automaticamente
ALTER TABLE clientes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE arquitetos ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Garante que as colunas created_at e updated_at tenham valores padrão
ALTER TABLE clientes ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE clientes ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE arquitetos ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE arquitetos ALTER COLUMN updated_at SET DEFAULT now();

-- Cria trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplica o trigger nas tabelas
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_arquitetos_updated_at ON arquitetos;
CREATE TRIGGER update_arquitetos_updated_at
    BEFORE UPDATE ON arquitetos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
