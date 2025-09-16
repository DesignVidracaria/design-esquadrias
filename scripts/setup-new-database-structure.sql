-- =====================================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA DO BANCO DE DADOS
-- Design Vidraçaria - Sistema de Atendimento
-- =====================================================

-- 1. LIMPEZA COMPLETA (se necessário)
-- =====================================================

-- Remover políticas RLS existentes
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Remover tipos customizados
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS atendimento_status CASCADE;

-- 2. CRIAÇÃO DOS TIPOS CUSTOMIZADOS
-- =====================================================

-- Tipo para roles de usuário
CREATE TYPE user_role AS ENUM ('administrador', 'vendedor');

-- Tipo para status de atendimento
CREATE TYPE atendimento_status AS ENUM ('pendente', 'em_andamento', 'concluido', 'cancelado');

-- 3. TABELA DE PERFIS DE USUÁRIO
-- =====================================================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    cargo TEXT,
    tipo_usuario user_role DEFAULT 'vendedor',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE ATENDIMENTOS (NOVA ESTRUTURA)
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

-- 5. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- =====================================================

CREATE TABLE configuracoes_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE LOG DE ATIVIDADES
-- =====================================================

CREATE TABLE log_atividades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    tabela_afetada TEXT,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para atendimentos
CREATE INDEX idx_atendimentos_status ON atendimentos(status);
CREATE INDEX idx_atendimentos_data ON atendimentos(data_atendimento);
CREATE INDEX idx_atendimentos_vendedor ON atendimentos(vendedor);
CREATE INDEX idx_atendimentos_cidade ON atendimentos(cidade);
CREATE INDEX idx_atendimentos_created_at ON atendimentos(created_at);
CREATE INDEX idx_atendimentos_user_id ON atendimentos(user_id);

-- Índices para profiles
CREATE INDEX idx_profiles_tipo_usuario ON profiles(tipo_usuario);
CREATE INDEX idx_profiles_ativo ON profiles(ativo);

-- Índices para log
CREATE INDEX idx_log_user_id ON log_atividades(user_id);
CREATE INDEX idx_log_created_at ON log_atividades(created_at);
CREATE INDEX idx_log_acao ON log_atividades(acao);

-- 8. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_atendimentos_updated_at BEFORE UPDATE ON atendimentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes_sistema FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, tipo_usuario, ativo)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
        NEW.email,
        'vendedor',
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. FUNÇÕES UTILITÁRIAS
-- =====================================================

-- Função para promover usuário a administrador
CREATE OR REPLACE FUNCTION promover_administrador(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Buscar o ID do usuário pelo email
    SELECT au.id INTO user_id
    FROM auth.users au
    WHERE au.email = user_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
    END IF;
    
    -- Atualizar o tipo de usuário para administrador
    UPDATE profiles 
    SET tipo_usuario = 'administrador',
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Registrar no log
    INSERT INTO log_atividades (user_id, acao, tabela_afetada, registro_id)
    VALUES (user_id, 'PROMOVIDO_ADMINISTRADOR', 'profiles', user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de atendimentos
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

-- 11. VIEW PARA ESTATÍSTICAS
-- =====================================================

CREATE OR REPLACE VIEW atendimentos_stats AS
SELECT * FROM get_atendimentos_stats();

-- 12. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Administradores podem ver todos os perfis" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

-- Políticas para atendimentos
CREATE POLICY "Usuários autenticados podem ver atendimentos" ON atendimentos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar atendimentos" ON atendimentos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem atualizar próprios atendimentos" ON atendimentos
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

CREATE POLICY "Administradores podem deletar atendimentos" ON atendimentos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

-- Políticas para configurações (apenas administradores)
CREATE POLICY "Administradores podem gerenciar configurações" ON configuracoes_sistema
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

-- Políticas para log (apenas administradores podem ver)
CREATE POLICY "Administradores podem ver logs" ON log_atividades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND tipo_usuario = 'administrador'
        )
    );

-- 13. INSERIR CONFIGURAÇÕES PADRÃO
-- =====================================================

INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES
('sistema_nome', 'Design Vidraçaria', 'Nome do sistema'),
('sistema_versao', '1.0.0', 'Versão atual do sistema'),
('empresa_nome', 'Design Vidraçaria', 'Nome da empresa'),
('empresa_telefone', '(33) 9 9998-8240', 'Telefone principal da empresa'),
('empresa_email', 'contato@designvidracaria.com.br', 'Email principal da empresa'),
('whatsapp_numero', '5533999988240', 'Número do WhatsApp para contato'),
('horario_funcionamento', 'Segunda a Sexta: 08:00 - 18:00', 'Horário de funcionamento'),
('backup_automatico', 'true', 'Ativar backup automático'),
('notificacoes_email', 'true', 'Enviar notificações por email'),
('manutencao_modo', 'false', 'Modo de manutenção ativo');

-- 14. INSERIR DADOS DE EXEMPLO
-- =====================================================

INSERT INTO atendimentos (
    nome, telefone, data_atendimento, cidade, endereco, vendedor, ja_cliente, observacoes, status
) VALUES
(
    'João Silva Santos',
    '(33) 99999-1234',
    '2024-01-15',
    'Governador Valadares',
    'Rua das Flores, 123 - Centro',
    'Carlos Vendedor',
    false,
    'Cliente interessado em esquadrias de alumínio para casa nova. Precisa de orçamento para 5 janelas e 2 portas.',
    'pendente'
),
(
    'Maria Oliveira Costa',
    '(33) 98888-5678',
    '2024-01-14',
    'Ipatinga',
    'Av. Brasil, 456 - Cidade Nobre',
    'Ana Vendedora',
    true,
    'Cliente já comprou conosco antes. Agora precisa de box para banheiro e guarda-corpo para varanda.',
    'em_andamento'
),
(
    'Pedro Almeida Rocha',
    '(33) 97777-9012',
    '2024-01-13',
    'Coronel Fabriciano',
    'Rua São José, 789 - São Geraldo',
    'Roberto Vendedor',
    false,
    'Interessado em fachada de vidro para prédio comercial. Projeto de grande porte.',
    'concluido'
),
(
    'Ana Paula Ferreira',
    '(33) 96666-3456',
    '2024-01-12',
    'Timóteo',
    'Rua das Palmeiras, 321 - Timirim',
    'Carlos Vendedor',
    true,
    'Manutenção em esquadrias existentes. Cliente fiel há 3 anos.',
    'concluido'
),
(
    'José Carlos Mendes',
    '(33) 95555-7890',
    '2024-01-11',
    'Governador Valadares',
    'Av. Minas Gerais, 654 - Grã Duquesa',
    'Ana Vendedora',
    false,
    'Orçamento para ripado de alumínio e brize. Obra residencial de alto padrão.',
    'cancelado'
);

-- =====================================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- =====================================================

-- Para criar o primeiro administrador, execute:
-- SELECT promover_administrador('seu-email@exemplo.com');

-- Para ver as estatísticas:
-- SELECT * FROM atendimentos_stats;

-- Para verificar se tudo foi criado corretamente:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
