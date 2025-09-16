-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- Para proteger dados de clientes e arquitetos
-- =====================================================

-- 1. HABILITAR RLS NAS TABELAS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquitetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_manutencao ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA CLIENTES
-- Clientes podem ver e editar apenas seus próprios dados
CREATE POLICY "Clientes podem ver seus próprios dados" ON public.clientes
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Clientes podem atualizar seus próprios dados" ON public.clientes
    FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos os clientes
CREATE POLICY "Admins podem ver todos os clientes" ON public.clientes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. POLÍTICAS PARA ARQUITETOS
-- Arquitetos podem ver e editar apenas seus próprios dados
CREATE POLICY "Arquitetos podem ver seus próprios dados" ON public.arquitetos
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Arquitetos podem atualizar seus próprios dados" ON public.arquitetos
    FOR UPDATE USING (auth.uid() = id);

-- Admins podem ver todos os arquitetos
CREATE POLICY "Admins podem ver todos os arquitetos" ON public.arquitetos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 4. POLÍTICAS PARA CHATS
-- Usuários podem ver apenas seus próprios chats
CREATE POLICY "Usuários podem ver seus próprios chats" ON public.chats
    FOR SELECT USING (user_id = auth.uid());

-- Usuários podem criar seus próprios chats
CREATE POLICY "Usuários podem criar seus próprios chats" ON public.chats
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seus próprios chats
CREATE POLICY "Usuários podem atualizar seus próprios chats" ON public.chats
    FOR UPDATE USING (user_id = auth.uid());

-- Admins podem ver todos os chats
CREATE POLICY "Admins podem ver todos os chats" ON public.chats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 5. POLÍTICAS PARA MENSAGENS
-- Usuários podem ver mensagens dos seus chats
CREATE POLICY "Usuários podem ver mensagens dos seus chats" ON public.mensagens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE id = chat_id AND user_id = auth.uid()
        )
    );

-- Usuários podem enviar mensagens nos seus chats
CREATE POLICY "Usuários podem enviar mensagens nos seus chats" ON public.mensagens
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chats 
            WHERE id = chat_id AND user_id = auth.uid()
        )
    );

-- Admins podem ver e enviar todas as mensagens
CREATE POLICY "Admins podem gerenciar todas as mensagens" ON public.mensagens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6. POLÍTICAS PARA SOLICITAÇÕES DE MANUTENÇÃO
-- Clientes podem ver apenas suas próprias solicitações
CREATE POLICY "Clientes podem ver suas solicitações" ON public.solicitacoes_manutencao
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clientes 
            WHERE id = cliente_id AND id = auth.uid()
        )
    );

-- Clientes podem criar suas próprias solicitações
CREATE POLICY "Clientes podem criar solicitações" ON public.solicitacoes_manutencao
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clientes 
            WHERE id = cliente_id AND id = auth.uid()
        )
    );

-- Clientes podem atualizar suas próprias solicitações
CREATE POLICY "Clientes podem atualizar suas solicitações" ON public.solicitacoes_manutencao
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clientes 
            WHERE id = cliente_id AND id = auth.uid()
        )
    );

-- Admins podem gerenciar todas as solicitações
CREATE POLICY "Admins podem gerenciar todas as solicitações" ON public.solicitacoes_manutencao
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 7. ATUALIZAR POLÍTICAS DA TABELA OBRAS
-- Clientes podem ver suas obras
CREATE POLICY "Clientes podem ver suas obras" ON public.obras
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clientes 
            WHERE id = cliente_id AND id = auth.uid()
        )
    );

-- Arquitetos podem ver obras vinculadas a eles
CREATE POLICY "Arquitetos podem ver suas obras vinculadas" ON public.obras
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.arquitetos 
            WHERE id = arquiteto_id AND id = auth.uid()
        )
    );
