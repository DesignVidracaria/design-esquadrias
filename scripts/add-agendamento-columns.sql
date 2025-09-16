-- Adicionando colunas para sistema de agendamento na tabela atendimentos
ALTER TABLE public.atendimentos 
ADD COLUMN IF NOT EXISTS data_agendamento DATE,
ADD COLUMN IF NOT EXISTS hora_agendamento TIME;

-- Comentários para documentar as novas colunas
COMMENT ON COLUMN public.atendimentos.data_agendamento IS 'Data agendada para o atendimento (opcional)';
COMMENT ON COLUMN public.atendimentos.hora_agendamento IS 'Horário agendado para o atendimento (opcional)';
