-- =====================================================
-- CONFIGURAÇÃO DE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_atividades ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA PROFILES
-- =====================================================
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- POLÍTICAS PARA ATENDIMENTOS
-- =====================================================
CREATE POLICY "atendimentos_select_own" ON atendimentos
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

CREATE POLICY "atendimentos_insert_authenticated" ON atendimentos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "atendimentos_update_own_or_admin" ON atendimentos
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

CREATE POLICY "atendimentos_delete_admin" ON atendimentos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

-- POLÍTICAS PARA BLOG POSTS
-- =====================================================
CREATE POLICY "blog_posts_select_active" ON blog_posts
    FOR SELECT USING (ativo = true);

CREATE POLICY "blog_posts_insert_authenticated" ON blog_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "blog_posts_update_own_or_admin" ON blog_posts
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

CREATE POLICY "blog_posts_delete_admin" ON blog_posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

-- POLÍTICAS PARA PORTFOLIO ITEMS
-- =====================================================
CREATE POLICY "portfolio_items_select_all" ON portfolio_items
    FOR SELECT USING (true);

CREATE POLICY "portfolio_items_insert_authenticated" ON portfolio_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "portfolio_items_update_own_or_admin" ON portfolio_items
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

CREATE POLICY "portfolio_items_delete_admin" ON portfolio_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

-- POLÍTICAS PARA CONFIGURAÇÕES DO SISTEMA
-- =====================================================
CREATE POLICY "configuracoes_sistema_select_all" ON configuracoes_sistema
    FOR SELECT USING (true);

CREATE POLICY "configuracoes_sistema_manage_admin" ON configuracoes_sistema
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

-- POLÍTICAS PARA LOG DE ATIVIDADES
-- =====================================================
CREATE POLICY "log_atividades_select_admin" ON log_atividades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.tipo_usuario = 'administrador'
        )
    );

CREATE POLICY "log_atividades_insert_authenticated" ON log_atividades
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
