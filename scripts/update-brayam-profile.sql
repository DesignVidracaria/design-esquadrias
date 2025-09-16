-- Verificar se o usuário BRAYAM existe e atualizar suas informações
UPDATE profiles 
SET 
    nome = 'BRAYAM',
    nickname = 'BRAYAM',
    tipo_usuario = 'administrador'
WHERE 
    email ILIKE '%brayam%' 
    OR nome ILIKE '%brayam%'
    OR nickname ILIKE '%brayam%';

-- Se não encontrar por nome, vamos buscar pelo email específico
-- Substitua 'email-do-brayam@exemplo.com' pelo email real
-- UPDATE profiles 
-- SET 
--     nome = 'BRAYAM',
--     nickname = 'BRAYAM',
--     tipo_usuario = 'administrador'
-- WHERE email = 'email-do-brayam@exemplo.com';

-- Verificar os dados atualizados
SELECT id, nome, email, nickname, tipo_usuario, ativo, created_at 
FROM profiles 
WHERE nome ILIKE '%brayam%' OR nickname ILIKE '%brayam%' OR email ILIKE '%brayam%';

-- Verificar todos os perfis para debug
SELECT id, nome, email, nickname, tipo_usuario, ativo 
FROM profiles 
ORDER BY created_at DESC;
