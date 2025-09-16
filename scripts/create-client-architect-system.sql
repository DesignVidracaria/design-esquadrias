-- =====================================================
-- SISTEMA DE CLIENTES E ARQUITETOS
-- Script completo para criar todas as tabelas necessárias
-- =====================================================

-- 1. TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    cpf_cnpj VARCHAR(20),
    data_nascimento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE ARQUITETOS
CREATE TABLE IF NOT EXISTS public.arquitetos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    cau VARCHAR(20), -- Registro no CAU (Conselho de Arquitetura e Urbanismo)
    especialidade VARCHAR(255),
    desconto_atual DECIMAL(5,2) DEFAULT 0.00,
    obras_vinculadas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE CHATS
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('cliente', 'arquiteto')),
    user_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'arquivado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE MENSAGENS
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('cliente', 'arquiteto', 'atendente')),
    sender_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE SOLICITAÇÕES DE MANUTENÇÃO
CREATE TABLE IF NOT EXISTS public.solicitacoes_manutencao (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo_servico VARCHAR(50) NOT NULL CHECK (tipo_servico IN (
        'reparo_vidro', 'troca_vidro', 'ajuste_esquadria', 
        'vedacao', 'limpeza_especializada', 'outros'
    )),
    descricao_problema TEXT NOT NULL,
    urgencia VARCHAR(20) NOT NULL CHECK (urgencia IN ('baixa', 'media', 'alta', 'urgente')),
    endereco TEXT NOT NULL,
    telefone_contato VARCHAR(20) NOT NULL,
    data_preferencial DATE,
    observacoes TEXT,
    imagens TEXT[], -- Array de URLs das imagens
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ATUALIZAR TABELA DE OBRAS (adicionar colunas para cliente e arquiteto)
ALTER TABLE public.obras 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id),
ADD COLUMN IF NOT EXISTS arquiteto_id UUID REFERENCES public.arquitetos(id);

-- 7. ÍNDICES PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_arquitetos_email ON public.arquitetos(email);
CREATE INDEX IF NOT EXISTS idx_chats_user ON public.chats(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat ON public.mensagens(chat_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cliente ON public.solicitacoes_manutencao(cliente_id);
CREATE INDEX IF NOT EXISTS idx_obras_cliente ON public.obras(cliente_id);
CREATE INDEX IF NOT EXISTS idx_obras_arquiteto ON public.obras(arquiteto_id);

-- 8. FUNÇÃO PARA ATUALIZAR DESCONTO DO ARQUITETO
CREATE OR REPLACE FUNCTION update_arquiteto_discount()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar contador de obras e desconto do arquiteto
    IF NEW.arquiteto_id IS NOT NULL THEN
        UPDATE public.arquitetos 
        SET 
            obras_vinculadas = (
                SELECT COUNT(*) 
                FROM public.obras 
                WHERE arquiteto_id = NEW.arquiteto_id
            ),
            desconto_atual = LEAST(
                (SELECT COUNT(*) FROM public.obras WHERE arquiteto_id = NEW.arquiteto_id) * 1.2,
                20.0
            ),
            updated_at = NOW()
        WHERE id = NEW.arquiteto_id;
    END IF;
    
    -- Se estava vinculado a outro arquiteto antes, atualizar o anterior também
    IF OLD.arquiteto_id IS NOT NULL AND OLD.arquiteto_id != NEW.arquiteto_id THEN
        UPDATE public.arquitetos 
        SET 
            obras_vinculadas = (
                SELECT COUNT(*) 
                FROM public.obras 
                WHERE arquiteto_id = OLD.arquiteto_id
            ),
            desconto_atual = LEAST(
                (SELECT COUNT(*) FROM public.obras WHERE arquiteto_id = OLD.arquiteto_id) * 1.2,
                20.0
            ),
            updated_at = NOW()
        WHERE id = OLD.arquiteto_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. TRIGGER PARA ATUALIZAR DESCONTO AUTOMATICAMENTE
DROP TRIGGER IF EXISTS trigger_update_arquiteto_discount ON public.obras;
CREATE TRIGGER trigger_update_arquiteto_discount
    AFTER INSERT OR UPDATE OF arquiteto_id ON public.obras
    FOR EACH ROW
    EXECUTE FUNCTION update_arquiteto_discount();

-- 10. FUNÇÃO PARA ATUALIZAR TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. TRIGGERS PARA ATUALIZAR TIMESTAMPS AUTOMATICAMENTE
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON public.clientes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arquitetos_updated_at 
    BEFORE UPDATE ON public.arquitetos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at 
    BEFORE UPDATE ON public.chats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solicitacoes_updated_at 
    BEFORE UPDATE ON public.solicitacoes_manutencao 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
