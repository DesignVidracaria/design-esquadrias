-- Script para corrigir a estrutura do banco de dados para suportar o sistema de orçamentos
-- e garantir que Admin/vendedor acessem dashboard e Cliente/arquiteto acessem /profile via /acesso

-- 1. Adicionar valores padrão para IDs das tabelas clientes e arquitetos
ALTER TABLE clientes 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE arquitetos 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Garantir que a tabela orcamentos tenha estrutura correta
-- (A tabela já existe conforme o schema, mas vamos garantir que está correta)

-- 3. Criar índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_arquitetos_nome ON arquitetos(nome);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero_orcamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_arquiteto ON orcamentos(arquiteto_id);

-- 4. Garantir que as políticas RLS estão configuradas corretamente
-- Permitir que admins e vendedores vejam todos os registros
-- Clientes e arquitetos só veem seus próprios dados

-- Políticas para clientes
DROP POLICY IF EXISTS "clientes_select_policy" ON clientes;
CREATE POLICY "clientes_select_policy" ON clientes
FOR SELECT USING (
  -- Admins e vendedores podem ver todos
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario IN ('admin', 'vendedor')
  )
  OR
  -- Clientes só veem seus próprios dados (via email matching)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario = 'cliente'
    AND profiles.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Políticas para arquitetos
DROP POLICY IF EXISTS "arquitetos_select_policy" ON arquitetos;
CREATE POLICY "arquitetos_select_policy" ON arquitetos
FOR SELECT USING (
  -- Admins e vendedores podem ver todos
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario IN ('admin', 'vendedor')
  )
  OR
  -- Arquitetos só veem seus próprios dados
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario = 'arquiteto'
    AND profiles.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Políticas para orçamentos
DROP POLICY IF EXISTS "orcamentos_select_policy" ON orcamentos;
CREATE POLICY "orcamentos_select_policy" ON orcamentos
FOR SELECT USING (
  -- Admins e vendedores podem ver todos
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario IN ('admin', 'vendedor')
  )
  OR
  -- Clientes veem orçamentos onde são o cliente
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN clientes c ON p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    WHERE p.id = auth.uid() 
    AND p.tipo_usuario = 'cliente'
    AND orcamentos.cliente_id = c.id
  )
  OR
  -- Arquitetos veem orçamentos onde são o arquiteto
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN arquitetos a ON p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    WHERE p.id = auth.uid() 
    AND p.tipo_usuario = 'arquiteto'
    AND orcamentos.arquiteto_id = a.id
  )
);

-- Habilitar RLS nas tabelas se não estiver habilitado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE arquitetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- 5. Inserir políticas de INSERT para admins e vendedores
DROP POLICY IF EXISTS "clientes_insert_policy" ON clientes;
CREATE POLICY "clientes_insert_policy" ON clientes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario IN ('admin', 'vendedor')
  )
);

DROP POLICY IF EXISTS "arquitetos_insert_policy" ON arquitetos;
CREATE POLICY "arquitetos_insert_policy" ON arquitetos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario IN ('admin', 'vendedor')
  )
);

DROP POLICY IF EXISTS "orcamentos_insert_policy" ON orcamentos;
CREATE POLICY "orcamentos_insert_policy" ON orcamentos
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.tipo_usuario IN ('admin', 'vendedor')
  )
);

-- 6. Garantir que a tabela profiles tem os tipos de usuário corretos
-- Verificar se o enum tipo_usuario inclui todos os tipos necessários
DO $$
BEGIN
  -- Tentar adicionar os valores ao enum se não existirem
  BEGIN
    ALTER TYPE tipo_usuario ADD VALUE IF NOT EXISTS 'admin';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER TYPE tipo_usuario ADD VALUE IF NOT EXISTS 'vendedor';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER TYPE tipo_usuario ADD VALUE IF NOT EXISTS 'cliente';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER TYPE tipo_usuario ADD VALUE IF NOT EXISTS 'arquiteto';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END$$;

-- Comentários para documentar a estrutura
COMMENT ON TABLE clientes IS 'Tabela de clientes - acessam via /acesso -> /profile';
COMMENT ON TABLE arquitetos IS 'Tabela de arquitetos - acessam via /acesso -> /profile';
COMMENT ON TABLE orcamentos IS 'Tabela de orçamentos - gerenciados por admin/vendedor via /dashboard';
COMMENT ON TABLE profiles IS 'Tabela de perfis de usuários - define tipo de acesso (admin/vendedor -> dashboard, cliente/arquiteto -> profile)';
