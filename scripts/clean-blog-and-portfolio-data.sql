-- =====================================================
-- LIMPEZA DE DADOS - BLOG E PORTFÓLIO
-- Remove todos os posts do blog e itens do portfólio
-- Mantém a estrutura das tabelas para novos registros
-- =====================================================

-- Limpar todos os posts do blog
DELETE FROM blog_posts;

-- Limpar todos os itens do portfólio  
DELETE FROM portfolio_items;

-- Resetar sequências se necessário (para IDs incrementais)
-- Como usamos UUID, não é necessário resetar sequências

-- Verificar se as tabelas estão vazias
SELECT 'blog_posts' as tabela, COUNT(*) as total_registros FROM blog_posts
UNION ALL
SELECT 'portfolio_items' as tabela, COUNT(*) as total_registros FROM portfolio_items;
