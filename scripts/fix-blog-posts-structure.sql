-- =====================================================
-- CORREÇÃO DA ESTRUTURA DA TABELA BLOG_POSTS
-- Design Vidraçaria - Sistema de Blog
-- =====================================================

-- 1. VERIFICAR E CRIAR TABELA BLOG_POSTS SE NÃO EXISTIR
-- =====================================================

DO $$
BEGIN
    -- Verificar se a tabela blog_posts existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'blog_posts') THEN
        -- Criar tabela blog_posts se não existir
        CREATE TABLE blog_posts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            titulo TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            autor_id UUID REFERENCES auth.users(id),
            autor_nome TEXT,
            imagens TEXT[] DEFAULT '{}',
            videos TEXT[] DEFAULT '{}',
            links JSONB DEFAULT '[]',
            fixado BOOLEAN DEFAULT false,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela blog_posts criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela blog_posts já existe';
    END IF;

    -- Adicionar coluna imagens se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'imagens') THEN
        ALTER TABLE blog_posts ADD COLUMN imagens TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Coluna imagens adicionada';
    END IF;

    -- Adicionar coluna videos se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'videos') THEN
        ALTER TABLE blog_posts ADD COLUMN videos TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Coluna videos adicionada';
    END IF;

    -- Adicionar coluna links se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'links') THEN
        ALTER TABLE blog_posts ADD COLUMN links JSONB DEFAULT '[]';
        RAISE NOTICE 'Coluna links adicionada';
    END IF;

    -- Adicionar coluna fixado se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'fixado') THEN
        ALTER TABLE blog_posts ADD COLUMN fixado BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna fixado adicionada';
    END IF;

    -- Adicionar coluna ativo se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'ativo') THEN
        ALTER TABLE blog_posts ADD COLUMN ativo BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna ativo adicionada';
    END IF;

    -- Adicionar coluna autor_nome se não existir
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'blog_posts' AND column_name = 'autor_nome') THEN
        ALTER TABLE blog_posts ADD COLUMN autor_nome TEXT;
        RAISE NOTICE 'Coluna autor_nome adicionada';
    END IF;
END $$;

-- 2. ADICIONAR COLUNAS QUE PODEM ESTAR FALTANDO
-- =====================================================
-- Colunas adicionadas no bloco acima

-- 3. CRIAR FUNÇÃO PARA UPDATED_AT SE NÃO EXISTIR
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. CRIAR TRIGGER PARA UPDATED_AT SE NÃO EXISTIR
-- =====================================================

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_fixado ON blog_posts(fixado) WHERE fixado = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_ativo ON blog_posts(ativo) WHERE ativo = true;

-- 6. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Todos podem ver posts ativos" ON blog_posts;
DROP POLICY IF EXISTS "Usuários autenticados podem criar posts" ON blog_posts;
DROP POLICY IF EXISTS "Usuários podem editar próprios posts" ON blog_posts;
DROP POLICY IF EXISTS "Administradores podem deletar posts" ON blog_posts;

-- Criar políticas
CREATE POLICY "Permitir leitura pública de posts ativos" ON blog_posts
    FOR SELECT USING (ativo = true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON blog_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização para o autor" ON blog_posts
    FOR UPDATE USING (auth.uid() = autor_id);

CREATE POLICY "Permitir exclusão para o autor" ON blog_posts
    FOR DELETE USING (auth.uid() = autor_id);

-- 7. INSERIR POST DE EXEMPLO SE NÃO EXISTIR
-- =====================================================

INSERT INTO blog_posts (titulo, conteudo, autor_nome, imagens, videos, links, fixado)
SELECT 
    'Bem-vindos ao Blog da Design Vidraçaria!',
    'Este é o primeiro post do nosso blog. Aqui você encontrará novidades, dicas e informações sobre nossos produtos e serviços em esquadrias de alumínio e vidros.',
    'Administrador',
    '{}',
    '{}',
    '[]',
    true
WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE titulo = 'Bem-vindos ao Blog da Design Vidraçaria!');

RAISE NOTICE 'Estrutura da tabela blog_posts configurada com sucesso!';

-- 8. VERIFICAR ESTRUTURA FINAL
-- =====================================================

-- Mostrar colunas da tabela para verificação
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY ordinal_position;

-- =====================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =====================================================
