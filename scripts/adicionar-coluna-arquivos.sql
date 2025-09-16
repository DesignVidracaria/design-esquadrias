-- =====================================================
-- ADICIONAR COLUNA ARQUIVOS NA TABELA ATENDIMENTOS
-- =====================================================

-- Remover tabela atendimento_arquivos se existir
DROP TABLE IF EXISTS atendimento_arquivos CASCADE;

-- Adicionar coluna arquivos na tabela atendimentos
ALTER TABLE atendimentos 
ADD COLUMN IF NOT EXISTS arquivos JSONB DEFAULT '[]'::jsonb;

-- Comentário na coluna
COMMENT ON COLUMN atendimentos.arquivos IS 'Array JSON com informações dos arquivos anexados ao atendimento';

-- Criar índice para melhor performance nas consultas JSON
CREATE INDEX IF NOT EXISTS idx_atendimentos_arquivos ON atendimentos USING GIN (arquivos);
