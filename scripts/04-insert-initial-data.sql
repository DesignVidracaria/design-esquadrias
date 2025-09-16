-- =====================================================
-- DADOS INICIAIS DO SISTEMA
-- =====================================================

-- Configurações iniciais do sistema
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES
('site_titulo', 'Design Vidraçaria', 'Título principal do site'),
('site_descricao', 'Especialistas em esquadrias de alumínio e vidros temperados', 'Descrição do site'),
('contato_telefone', '(11) 99999-9999', 'Telefone principal para contato'),
('contato_email', 'contato@designvidracaria.com.br', 'Email principal para contato'),
('contato_endereco', 'Rua das Esquadrias, 123 - São Paulo, SP', 'Endereço da empresa'),
('whatsapp_numero', '5511999999999', 'Número do WhatsApp (com código do país)'),
('instagram_url', 'https://instagram.com/designvidracaria', 'URL do Instagram'),
('facebook_url', 'https://facebook.com/designvidracaria', 'URL do Facebook'),
('horario_funcionamento', 'Segunda a Sexta: 8h às 18h | Sábado: 8h às 12h', 'Horário de funcionamento'),
('sobre_empresa', 'Há mais de 10 anos no mercado, a Design Vidraçaria é especializada em esquadrias de alumínio e vidros temperados, oferecendo soluções completas para residências e empresas.', 'Texto sobre a empresa')
ON CONFLICT (chave) DO NOTHING;

-- Seções do portfólio
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES
('portfolio_secoes', '["esquadrias-de-aluminio", "fachadas", "box-para-banheiro", "guarda-corpo", "coberturas", "portas-e-janelas"]', 'Seções disponíveis no portfólio (JSON array)')
ON CONFLICT (chave) DO NOTHING;

-- Verificar se existem dados
SELECT 'Configurações inseridas:' as status, COUNT(*) as total FROM configuracoes_sistema;
