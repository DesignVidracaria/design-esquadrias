-- =====================================================
-- FUNÇÕES AUXILIARES DO SISTEMA
-- =====================================================

-- Função para buscar estatísticas de atendimentos
CREATE OR REPLACE FUNCTION get_atendimentos_stats()
RETURNS TABLE (
    total_atendimentos BIGINT,
    pendentes BIGINT,
    em_andamento BIGINT,
    concluidos BIGINT,
    cancelados BIGINT,
    hoje BIGINT,
    esta_semana BIGINT,
    este_mes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_atendimentos,
        COUNT(*) FILTER (WHERE status = 'pendente')::BIGINT as pendentes,
        COUNT(*) FILTER (WHERE status = 'em_andamento')::BIGINT as em_andamento,
        COUNT(*) FILTER (WHERE status = 'concluido')::BIGINT as concluidos,
        COUNT(*) FILTER (WHERE status = 'cancelado')::BIGINT as cancelados,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::BIGINT as hoje,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT as esta_semana,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT as este_mes
    FROM atendimentos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para registrar atividades no log
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_acao TEXT,
    p_tabela_afetada TEXT,
    p_registro_id UUID DEFAULT NULL,
    p_dados_anteriores JSONB DEFAULT NULL,
    p_dados_novos JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO log_atividades (
        user_id, acao, tabela_afetada, registro_id, 
        dados_anteriores, dados_novos, ip_address, user_agent
    ) VALUES (
        p_user_id, p_acao, p_tabela_afetada, p_registro_id,
        p_dados_anteriores, p_dados_novos, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar posts do blog com paginação
CREATE OR REPLACE FUNCTION get_blog_posts(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_only_active BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    titulo TEXT,
    conteudo TEXT,
    autor_nickname TEXT,
    user_id UUID,
    imagens TEXT[],
    arquivos JSONB,
    fixado BOOLEAN,
    ativo BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id, bp.titulo, bp.conteudo, bp.autor_nickname, bp.user_id,
        bp.imagens, bp.arquivos, bp.fixado, bp.ativo, bp.created_at, bp.updated_at
    FROM blog_posts bp
    WHERE (NOT p_only_active OR bp.ativo = true)
    ORDER BY bp.fixado DESC, bp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar itens do portfólio por seção
CREATE OR REPLACE FUNCTION get_portfolio_items(
    p_secao TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    titulo TEXT,
    secao TEXT,
    descricao TEXT,
    imagem_url TEXT,
    link_projeto TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pi.id, pi.titulo, pi.secao, pi.descricao, pi.imagem_url,
        pi.link_projeto, pi.user_id, pi.created_at, pi.updated_at
    FROM portfolio_items pi
    WHERE (p_secao IS NULL OR pi.secao = p_secao)
    ORDER BY pi.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, nome, nickname)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
