-- =====================================================
-- CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Design Vidraçaria - Sistema Completo
-- =====================================================

-- 1. LIMPEZA COMPLETA (se necessário)
-- =====================================================
DROP TABLE IF EXISTS log_atividades CASCADE;
DROP TABLE IF EXISTS atendimentos_stats CASCADE;
DROP TABLE IF EXISTS configuracoes_sistema CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS portfolio_items CASCADE;
DROP TABLE IF EXISTS atendimentos CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Remover tipos customizados
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS atendimento_status CASCADE;

-- 2. CRIAÇÃO DOS TIPOS CUSTOMIZADOS
-- =====================================================
CREATE TYPE user_role AS ENUM ('administrador', 'vendedor');
CREATE TYPE atendimento_status AS ENUM ('pendente', 'em_andamento', 'concluido', 'cancelado');

-- 3. TABELA DE PERFIS DE USUÁRIO
-- =====================================================
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    cargo TEXT,
    nickname TEXT,
    foto_perfil TEXT,
    tipo_usuario user_role DEFAULT 'vendedor',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE ATENDIMENTOS
-- =====================================================
CREATE TABLE atendimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    data_atendimento DATE NOT NULL,
    cidade TEXT NOT NULL,
    endereco TEXT NOT NULL,
    vendedor TEXT NOT NULL,
    ja_cliente BOOLEAN DEFAULT false,
    observacoes TEXT,
    status atendimento_status DEFAULT 'pendente',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE POSTS DO BLOG
-- =====================================================
CREATE TABLE blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    autor_nickname TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    imagens TEXT[] DEFAULT '{}',
    arquivos JSONB DEFAULT '{}',
    fixado BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE ITENS DO PORTFÓLIO
-- =====================================================
CREATE TABLE portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    secao TEXT NOT NULL,
    descricao TEXT NOT NULL,
    imagem_url TEXT NOT NULL,
    link_projeto TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- =====================================================
CREATE TABLE configuracoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE LOG DE ATIVIDADES
-- =====================================================
CREATE TABLE log_atividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. VIEW PARA ESTATÍSTICAS DE ATENDIMENTOS
-- =====================================================
CREATE OR REPLACE VIEW atendimentos_stats AS
SELECT 
    COUNT(*) as total_atendimentos,
    COUNT(*) FILTER (WHERE status = 'pendente') as pendentes,
    COUNT(*) FILTER (WHERE status = 'em_andamento') as em_andamento,
    COUNT(*) FILTER (WHERE status = 'concluido') as concluidos,
    COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as hoje,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as esta_semana,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as este_mes
FROM atendimentos;

-- 10. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_nickname ON profiles(nickname);
CREATE INDEX idx_profiles_tipo_usuario ON profiles(tipo_usuario);

CREATE INDEX idx_atendimentos_status ON atendimentos(status);
CREATE INDEX idx_atendimentos_data ON atendimentos(data_atendimento);
CREATE INDEX idx_atendimentos_user_id ON atendimentos(user_id);
CREATE INDEX idx_atendimentos_created_at ON atendimentos(created_at);

CREATE INDEX idx_blog_posts_ativo ON blog_posts(ativo);
CREATE INDEX idx_blog_posts_fixado ON blog_posts(fixado);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX idx_blog_posts_user_id ON blog_posts(user_id);

CREATE INDEX idx_portfolio_items_secao ON portfolio_items(secao);
CREATE INDEX idx_portfolio_items_created_at ON portfolio_items(created_at);
CREATE INDEX idx_portfolio_items_user_id ON portfolio_items(user_id);

CREATE INDEX idx_log_atividades_user_id ON log_atividades(user_id);
CREATE INDEX idx_log_atividades_tabela ON log_atividades(tabela_afetada);
CREATE INDEX idx_log_atividades_created_at ON log_atividades(created_at);

-- 11. FUNÇÕES DE TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_atendimentos_updated_at BEFORE UPDATE ON atendimentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_items_updated_at BEFORE UPDATE ON portfolio_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracoes_sistema_updated_at BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
