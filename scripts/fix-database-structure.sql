-- =====================================================
-- FIX PARA ERROS DE ESTRUTURA DO BANCO DE DADOS
-- Design Vidraçaria - Correção de Colunas e Tabelas
-- =====================================================

-- 1. CORRIGIR TABELA PORTFOLIO_ITEMS
-- =====================================================

-- Adicionar coluna imagem_principal (renomear imagem_url)
ALTER TABLE portfolio_items 
RENAME COLUMN imagem_url TO imagem_principal;

-- Adicionar coluna ordem para ordenação
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Adicionar coluna galeria para múltiplas imagens
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS galeria TEXT[] DEFAULT '{}';

-- Adicionar coluna cores para opções de cores
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS cores TEXT[] DEFAULT '{}';

-- Adicionar coluna ativo para controle de visibilidade
ALTER TABLE portfolio_items 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 2. CRIAR TABELA SECOES
-- =====================================================

CREATE TABLE IF NOT EXISTS secoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    titulo_exibicao TEXT NOT NULL,
    descricao TEXT,
    icone TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INSERIR SEÇÕES PADRÃO
-- =====================================================

INSERT INTO secoes (nome, titulo_exibicao, descricao, ordem) VALUES
('esquadrias-de-aluminio', 'Esquadrias de Alumínio', 'Janelas, portas e esquadrias em alumínio de alta qualidade', 1),
('fachadas', 'Fachadas', 'Fachadas modernas e elegantes para seu projeto', 2),
('box-para-banheiro', 'Box para Banheiro', 'Box de vidro temperado para banheiros', 3),
('guarda-corpo', 'Guarda-Corpo', 'Guarda-corpos em vidro e alumínio', 4),
('coberturas', 'Coberturas', 'Coberturas em vidro e policarbonato', 5),
('divisorias', 'Divisórias', 'Divisórias em vidro para ambientes corporativos', 6)
ON CONFLICT (nome) DO NOTHING;

-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_portfolio_items_secao ON portfolio_items(secao);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_ordem ON portfolio_items(ordem);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_ativo ON portfolio_items(ativo);
CREATE INDEX IF NOT EXISTS idx_secoes_ordem ON secoes(ordem);
CREATE INDEX IF NOT EXISTS idx_secoes_ativo ON secoes(ativo);

-- 5. CRIAR TRIGGER PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para portfolio_items
DROP TRIGGER IF EXISTS update_portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para secoes
DROP TRIGGER IF EXISTS update_secoes_updated_at ON secoes;
CREATE TRIGGER update_secoes_updated_at
    BEFORE UPDATE ON secoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE secoes ENABLE ROW LEVEL SECURITY;

-- Políticas para portfolio_items
DROP POLICY IF EXISTS "Permitir visualização pública de itens do portfólio" ON portfolio_items;
CREATE POLICY "Permitir visualização pública de itens do portfólio" ON portfolio_items
    FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON portfolio_items;
CREATE POLICY "Permitir inserção para usuários autenticados" ON portfolio_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON portfolio_items;
CREATE POLICY "Permitir atualização para usuários autenticados" ON portfolio_items
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON portfolio_items;
CREATE POLICY "Permitir exclusão para usuários autenticados" ON portfolio_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para secoes
DROP POLICY IF EXISTS "Permitir visualização pública de seções" ON secoes;
CREATE POLICY "Permitir visualização pública de seções" ON secoes
    FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "Permitir gerenciamento de seções para usuários autenticados" ON secoes;
CREATE POLICY "Permitir gerenciamento de seções para usuários autenticados" ON secoes
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as colunas foram criadas corretamente
DO $$
BEGIN
    -- Verificar portfolio_items
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portfolio_items' AND column_name = 'imagem_principal'
    ) THEN
        RAISE EXCEPTION 'Coluna imagem_principal não foi criada em portfolio_items';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portfolio_items' AND column_name = 'ordem'
    ) THEN
        RAISE EXCEPTION 'Coluna ordem não foi criada em portfolio_items';
    END IF;
    
    -- Verificar secoes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'secoes'
    ) THEN
        RAISE EXCEPTION 'Tabela secoes não foi criada';
    END IF;
    
    RAISE NOTICE 'Estrutura do banco de dados corrigida com sucesso!';
END $$;
