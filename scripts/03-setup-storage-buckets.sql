-- =====================================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- =====================================================

-- Criar bucket para mídia geral
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para imagens do blog
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para imagens do portfólio
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- POLÍTICAS PARA STORAGE - BUCKET MEDIA
-- =====================================================
CREATE POLICY "Permitir visualização pública de mídia" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Permitir upload de mídia para usuários autenticados" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de mídia para usuários autenticados" ON storage.objects
FOR UPDATE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de mídia para administradores" ON storage.objects
FOR DELETE USING (
    bucket_id = 'media' AND 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_usuario = 'administrador'
    )
);

-- POLÍTICAS PARA STORAGE - BUCKET BLOG-IMAGES
-- =====================================================
CREATE POLICY "Permitir visualização pública de imagens do blog" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Permitir upload de imagens do blog para usuários autenticados" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de imagens do blog para usuários autenticados" ON storage.objects
FOR UPDATE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de imagens do blog para administradores" ON storage.objects
FOR DELETE USING (
    bucket_id = 'blog-images' AND 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_usuario = 'administrador'
    )
);

-- POLÍTICAS PARA STORAGE - BUCKET PORTFOLIO-IMAGES
-- =====================================================
CREATE POLICY "Permitir visualização pública de imagens do portfólio" ON storage.objects
FOR SELECT USING (bucket_id = 'portfolio-images');

CREATE POLICY "Permitir upload de imagens do portfólio para usuários autenticados" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de imagens do portfólio para usuários autenticados" ON storage.objects
FOR UPDATE USING (bucket_id = 'portfolio-images' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de imagens do portfólio para administradores" ON storage.objects
FOR DELETE USING (
    bucket_id = 'portfolio-images' AND 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.tipo_usuario = 'administrador'
    )
);

-- POLÍTICAS PARA STORAGE - BUCKET PROFILE-PHOTOS
-- =====================================================
CREATE POLICY "Permitir visualização pública de fotos de perfil" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Permitir upload de fotos de perfil para usuários autenticados" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de própria foto de perfil" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile-photos' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Permitir exclusão de própria foto de perfil" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profile-photos' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
