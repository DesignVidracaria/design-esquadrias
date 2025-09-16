-- Adicionar novas colunas às tabelas clientes e arquitetos

-- Adicionar colunas à tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- Adicionar colunas à tabela arquitetos  
ALTER TABLE public.arquitetos
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;

-- Renomear coluna cau para registro_profissional para aceitar CAU/CREA
ALTER TABLE public.arquitetos 
RENAME COLUMN cau TO registro_profissional;

-- Comentários para documentar as colunas
COMMENT ON COLUMN public.clientes.cidade IS 'Cidade do cliente';
COMMENT ON COLUMN public.clientes.estado IS 'Estado (UF) do cliente';
COMMENT ON COLUMN public.arquitetos.cidade IS 'Cidade do arquiteto';
COMMENT ON COLUMN public.arquitetos.estado IS 'Estado (UF) do arquiteto';
COMMENT ON COLUMN public.arquitetos.cpf_cnpj IS 'CPF do arquiteto';
COMMENT ON COLUMN public.arquitetos.registro_profissional IS 'Registro profissional (CAU ou CREA) do arquiteto';
