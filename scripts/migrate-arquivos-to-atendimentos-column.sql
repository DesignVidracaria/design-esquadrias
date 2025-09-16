-- =====================================================
-- MIGRAR ARQUIVOS PARA COLUNA NA TABELA ATENDIMENTOS
-- =====================================================

-- 1. Adicionar coluna arquivos na tabela atendimentos
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS arquivos JSONB DEFAULT '[]'::jsonb;

-- 2. Migrar dados existentes da tabela atendimento_arquivos para a nova coluna
UPDATE atendimentos 
SET arquivos = (
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', aa.id,
            'nome_original', aa.nome_original,
            'nome_arquivo', aa.nome_arquivo,
            'tipo_arquivo', aa.tipo_arquivo,
            'tamanho_arquivo', aa.tamanho_arquivo,
            'url_arquivo', aa.url_arquivo,
            'created_at', aa.created_at
        )
    ), '[]'::jsonb)
    FROM atendimento_arquivos aa 
    WHERE aa.atendimento_id = atendimentos.id
);

-- 3. Remover a tabela atendimento_arquivos
DROP TABLE IF EXISTS atendimento_arquivos CASCADE;

-- 4. Criar índice para a nova coluna arquivos
CREATE INDEX IF NOT EXISTS idx_atendimentos_arquivos ON atendimentos USING GIN (arquivos);

-- 5. Comentário na coluna para documentação
COMMENT ON COLUMN atendimentos.arquivos IS 'Array JSON contendo informações dos arquivos anexados ao atendimento';
