-- Adicionar campo nickname na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Criar índice para o nickname
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- Atualizar os registros existentes com nicknames baseados no nome
UPDATE profiles 
SET nickname = CASE 
    WHEN nome IS NOT NULL THEN split_part(nome, ' ', 1)
    ELSE split_part(email, '@', 1)
END
WHERE nickname IS NULL;

-- Adicionar constraint para garantir que nickname não seja vazio
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS profiles_nickname_check CHECK (length(nickname) >= 2);

-- Comentário na coluna
COMMENT ON COLUMN profiles.nickname IS 'Apelido/nickname do usuário para identificação rápida';
