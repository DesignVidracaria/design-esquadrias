-- =====================================================
-- CRIAÇÃO DAS TABELAS PARA BLOG E PORTFÓLIO
-- =====================================================

-- 1. TABELA DE POSTS DO BLOG
-- =====================================================
CREATE TABLE blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    autor_nickname TEXT NOT NULL,
    autor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    imagens TEXT[], -- Array de URLs das imagens
    arquivos JSONB, -- JSON com informações dos arquivos {nome, url, tipo}
    links JSONB, -- JSON com links e suas previews {url, titulo, preview}
    rodape TEXT,
    fixado BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE ITENS DO PORTFÓLIO
-- =====================================================
CREATE TABLE portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    secao TEXT NOT NULL, -- esquadrias-de-aluminio, fachadas, etc.
    descricao TEXT NOT NULL,
    imagem_principal TEXT NOT NULL, -- URL da imagem principal
    galeria TEXT[], -- Array de URLs das imagens da galeria
    cores TEXT[], -- Array de cores disponíveis (opcional)
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0, -- Para ordenação dentro da seção
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADICIONAR CAMPO DE FOTO NO PERFIL
-- =====================================================
ALTER TABLE profiles ADD COLUMN foto_perfil TEXT;

-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX idx_blog_posts_fixado ON blog_posts(fixado);
CREATE INDEX idx_blog_posts_ativo ON blog_posts(ativo);
CREATE INDEX idx_blog_posts_autor ON blog_posts(autor_id);

CREATE INDEX idx_portfolio_items_secao ON portfolio_items(secao);
CREATE INDEX idx_portfolio_items_ativo ON portfolio_items(ativo);
CREATE INDEX idx_portfolio_items_ordem ON portfolio_items(ordem);

-- 5. TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at 
    BEFORE UPDATE ON portfolio_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. POLÍTICAS RLS
-- =====================================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Políticas para blog_posts
CREATE POLICY "Todos podem ver posts ativos" ON blog_posts
    FOR SELECT USING (ativo = true);

CREATE POLICY "Usuários autenticados podem criar posts" ON blog_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem editar próprios posts" ON blog_posts
    FOR UPDATE USING (
        auth.uid() = autor_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

CREATE POLICY "Administradores podem deletar posts" ON blog_posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

-- Políticas para portfolio_items
CREATE POLICY "Todos podem ver itens ativos" ON portfolio_items
    FOR SELECT USING (ativo = true);

CREATE POLICY "Usuários autenticados podem criar itens" ON portfolio_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem editar itens" ON portfolio_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Administradores podem deletar itens" ON portfolio_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

-- 7. INSERIR DADOS DE EXEMPLO
-- =====================================================
INSERT INTO blog_posts (titulo, conteudo, autor_nickname, autor_id, rodape, fixado) VALUES
(
    'Bem-vindos ao nosso Blog!',
    'Estamos muito felizes em lançar nosso blog oficial da Design Vidraçaria. Aqui você encontrará as últimas novidades, dicas e projetos incríveis que realizamos.',
    'Admin',
    (SELECT id FROM auth.users LIMIT 1),
    'Design Vidraçaria - Sua especialista em esquadrias',
    true
);

-- Comentário na coluna foto_perfil
COMMENT ON COLUMN profiles.foto_perfil IS 'URL da foto de perfil do usuário';
