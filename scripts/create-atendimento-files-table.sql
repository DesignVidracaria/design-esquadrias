-- =====================================================
-- TABELA PARA ARQUIVOS DE ATENDIMENTOS
-- =====================================================

-- Criar tabela para armazenar arquivos anexados aos atendimentos
CREATE TABLE IF NOT EXISTS atendimento_arquivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    nome_original TEXT NOT NULL,
    tipo_arquivo TEXT NOT NULL,
    tamanho_arquivo BIGINT NOT NULL,
    url_arquivo TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_atendimento_arquivos_atendimento_id ON atendimento_arquivos(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_atendimento_arquivos_user_id ON atendimento_arquivos(user_id);
CREATE INDEX IF NOT EXISTS idx_atendimento_arquivos_created_at ON atendimento_arquivos(created_at);

-- Habilitar RLS
ALTER TABLE atendimento_arquivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para atendimento_arquivos
CREATE POLICY "Usuários podem ver arquivos de atendimentos" ON atendimento_arquivos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem inserir arquivos de atendimentos" ON atendimento_arquivos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios arquivos" ON atendimento_arquivos
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_atendimento_arquivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_atendimento_arquivos_updated_at
    BEFORE UPDATE ON atendimento_arquivos
    FOR EACH ROW
    EXECUTE FUNCTION update_atendimento_arquivos_updated_at();

-- Criar bucket para arquivos de atendimentos no Storage (se não existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('atendimento-arquivos', 'atendimento-arquivos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket atendimento-arquivos
CREATE POLICY "Permitir upload de arquivos para usuários autenticados" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'atendimento-arquivos' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir visualização de arquivos para usuários autenticados" ON storage.objects
FOR SELECT USING (bucket_id = 'atendimento-arquivos' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir download de arquivos para usuários autenticados" ON storage.objects
FOR SELECT USING (bucket_id = 'atendimento-arquivos' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de arquivos pelo proprietário" ON storage.objects
FOR DELETE USING (bucket_id = 'atendimento-arquivos' AND auth.uid()::text = (storage.foldername(name))[1]);
