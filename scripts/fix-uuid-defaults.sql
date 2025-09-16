-- Adicionando valores padrão para colunas ID das tabelas clientes e arquitetos
-- Corrige o erro "null value in column 'id' violates not-null constraint"

-- Adicionar valor padrão para a coluna ID da tabela clientes
ALTER TABLE clientes 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Adicionar valor padrão para a coluna ID da tabela arquitetos  
ALTER TABLE arquitetos 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verificar se existe tabela orcamentos, se não existir, criar
CREATE TABLE IF NOT EXISTS orcamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_orcamento text NOT NULL UNIQUE,
    cliente_id uuid REFERENCES clientes(id),
    arquiteto_id uuid REFERENCES arquitetos(id),
    vendedor text,
    responsavel_obra text,
    observacao text,
    arquivos jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'pendente',
    valor_total decimal(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela orcamentos
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Política para admins e vendedores poderem ver todos os orçamentos
CREATE POLICY "Admins e vendedores podem ver todos os orçamentos" ON orcamentos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo IN ('admin', 'vendedor')
        )
    );

-- Política para clientes verem apenas seus próprios orçamentos
CREATE POLICY "Clientes podem ver seus próprios orçamentos" ON orcamentos
    FOR SELECT USING (
        cliente_id IN (
            SELECT clientes.id FROM clientes 
            JOIN profiles ON profiles.id = auth.uid()
            WHERE profiles.tipo = 'cliente'
        )
    );

-- Política para arquitetos verem orçamentos onde são responsáveis
CREATE POLICY "Arquitetos podem ver orçamentos onde são responsáveis" ON orcamentos
    FOR SELECT USING (
        arquiteto_id IN (
            SELECT arquitetos.id FROM arquitetos 
            JOIN profiles ON profiles.id = auth.uid()
            WHERE profiles.tipo = 'arquiteto'
        )
    );

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_arquiteto_id ON orcamentos(arquiteto_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_numero ON orcamentos(numero_orcamento);
CREATE INDEX IF NOT EXISTS idx_orcamentos_created_at ON orcamentos(created_at);
