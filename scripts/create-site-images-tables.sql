-- =====================================================
-- CRIAÇÃO DAS TABELAS PARA GERENCIAMENTO DE IMAGENS DO SITE
-- =====================================================

-- Tabela para imagens do HeroSection
CREATE TABLE IF NOT EXISTS hero_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_arquivo TEXT NOT NULL,
    url_imagem TEXT NOT NULL,
    alt_text TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para imagens de background das páginas
CREATE TABLE IF NOT EXISTS background_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_arquivo TEXT NOT NULL,
    url_imagem TEXT NOT NULL,
    pagina TEXT NOT NULL, -- inicio, atendimento, portfolio, blog, instalacoes, nossa-historia
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_hero_images_ordem ON hero_images(ordem);
CREATE INDEX IF NOT EXISTS idx_hero_images_ativo ON hero_images(ativo);
CREATE INDEX IF NOT EXISTS idx_background_images_pagina ON background_images(pagina);
CREATE INDEX IF NOT EXISTS idx_background_images_ordem ON background_images(ordem);

-- Políticas RLS
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_images ENABLE ROW LEVEL SECURITY;

-- Políticas para hero_images
CREATE POLICY "Permitir visualização pública de hero_images" ON hero_images
    FOR SELECT USING (ativo = true);

CREATE POLICY "Permitir gerenciamento de hero_images para usuários autenticados" ON hero_images
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para background_images
CREATE POLICY "Permitir visualização pública de background_images" ON background_images
    FOR SELECT USING (ativo = true);

CREATE POLICY "Permitir gerenciamento de background_images para usuários autenticados" ON background_images
    FOR ALL USING (auth.role() = 'authenticated');

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_images_updated_at BEFORE UPDATE ON hero_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_background_images_updated_at BEFORE UPDATE ON background_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
