-- Criar bucket de mídia público no Supabase Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Políticas para o bucket media
CREATE POLICY "Permitir upload de mídia para usuários autenticados" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir visualização pública de mídia" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Permitir atualização de mídia para usuários autenticados" ON storage.objects
FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de mídia para usuários autenticados" ON storage.objects
FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Adicionar campo foto_perfil na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS foto_perfil TEXT;

-- Adicionar campos de mídia na tabela blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS imagens TEXT[];
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS arquivos JSONB;

-- Adicionar campo ativo na tabela blog_posts para controle de visibilidade
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_ativo ON blog_posts(ativo);
CREATE INDEX IF NOT EXISTS idx_blog_posts_fixado ON blog_posts(fixado);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_secao ON portfolio_items(secao);

-- Comentários para documentação
COMMENT ON COLUMN profiles.foto_perfil IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN blog_posts.imagens IS 'Array de URLs das imagens do post';
COMMENT ON COLUMN blog_posts.arquivos IS 'Array de objetos com informações dos arquivos (vídeos, etc.)';
COMMENT ON COLUMN blog_posts.ativo IS 'Controla se o post está visível no blog';
