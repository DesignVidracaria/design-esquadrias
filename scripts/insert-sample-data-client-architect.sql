-- =====================================================
-- DADOS DE EXEMPLO
-- Para testar o sistema de clientes e arquitetos
-- =====================================================

-- 1. INSERIR CLIENTES DE EXEMPLO
INSERT INTO public.clientes (nome, email, telefone, endereco, cpf_cnpj) VALUES
('João Silva', 'joao.silva@email.com', '(11) 99999-1111', 'Rua das Flores, 123 - São Paulo, SP', '123.456.789-00'),
('Maria Santos', 'maria.santos@email.com', '(11) 99999-2222', 'Av. Paulista, 456 - São Paulo, SP', '987.654.321-00'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '(11) 99999-3333', 'Rua Augusta, 789 - São Paulo, SP', '456.789.123-00'),
('Ana Costa', 'ana.costa@email.com', '(11) 99999-4444', 'Rua Oscar Freire, 321 - São Paulo, SP', '789.123.456-00'),
('Carlos Ferreira', 'carlos.ferreira@email.com', '(11) 99999-5555', 'Av. Faria Lima, 654 - São Paulo, SP', '321.654.987-00');

-- 2. INSERIR ARQUITETOS DE EXEMPLO
INSERT INTO public.arquitetos (nome, email, telefone, endereco, cau, especialidade) VALUES
('Arq. Fernanda Lima', 'fernanda.lima@arquitetura.com', '(11) 98888-1111', 'Rua dos Arquitetos, 100 - São Paulo, SP', 'CAU-SP-12345', 'Arquitetura Residencial'),
('Arq. Roberto Mendes', 'roberto.mendes@design.com', '(11) 98888-2222', 'Av. Design, 200 - São Paulo, SP', 'CAU-SP-67890', 'Arquitetura Comercial'),
('Arq. Juliana Rocha', 'juliana.rocha@projetos.com', '(11) 98888-3333', 'Rua Criativa, 300 - São Paulo, SP', 'CAU-SP-11111', 'Interiores'),
('Arq. Marcos Alves', 'marcos.alves@sustentavel.com', '(11) 98888-4444', 'Av. Verde, 400 - São Paulo, SP', 'CAU-SP-22222', 'Arquitetura Sustentável'),
('Arq. Camila Torres', 'camila.torres@inovacao.com', '(11) 98888-5555', 'Rua Moderna, 500 - São Paulo, SP', 'CAU-SP-33333', 'Arquitetura Contemporânea');

-- 3. INSERIR ALGUMAS SOLICITAÇÕES DE MANUTENÇÃO DE EXEMPLO
INSERT INTO public.solicitacoes_manutencao (
    cliente_id, 
    tipo_servico, 
    descricao_problema, 
    urgencia, 
    endereco, 
    telefone_contato,
    observacoes,
    status
) VALUES
(
    (SELECT id FROM public.clientes WHERE email = 'joao.silva@email.com'),
    'reparo_vidro',
    'Vidro da janela da sala está com uma pequena rachadura que precisa ser reparada.',
    'media',
    'Rua das Flores, 123 - São Paulo, SP',
    '(11) 99999-1111',
    'Preferência para atendimento no período da manhã.',
    'pendente'
),
(
    (SELECT id FROM public.clientes WHERE email = 'maria.santos@email.com'),
    'limpeza_especializada',
    'Preciso de limpeza especializada nas janelas do escritório, são vidros muito altos.',
    'baixa',
    'Av. Paulista, 456 - São Paulo, SP',
    '(11) 99999-2222',
    'Edifício comercial, coordenar com a administração.',
    'pendente'
);

-- 4. COMENTÁRIOS EXPLICATIVOS
COMMENT ON TABLE public.clientes IS 'Tabela para armazenar dados dos clientes registrados no sistema';
COMMENT ON TABLE public.arquitetos IS 'Tabela para armazenar dados dos arquitetos registrados no sistema';
COMMENT ON TABLE public.chats IS 'Tabela para gerenciar conversas entre usuários e atendentes';
COMMENT ON TABLE public.mensagens IS 'Tabela para armazenar mensagens dos chats';
COMMENT ON TABLE public.solicitacoes_manutencao IS 'Tabela para solicitações de manutenção dos clientes';

COMMENT ON COLUMN public.arquitetos.desconto_atual IS 'Desconto atual do arquiteto baseado no número de obras (1,2% por obra, máximo 20%)';
COMMENT ON COLUMN public.arquitetos.obras_vinculadas IS 'Contador automático de obras vinculadas ao arquiteto';
COMMENT ON COLUMN public.solicitacoes_manutencao.imagens IS 'Array de URLs das imagens anexadas à solicitação';
