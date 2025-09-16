-- Adicionar coluna foto_perfil à tabela profiles se não existir
DO $$ 
BEGIN
    -- Verificar se a coluna foto_perfil existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'foto_perfil'
    ) THEN
        -- Adicionar a coluna foto_perfil
        ALTER TABLE profiles ADD COLUMN foto_perfil TEXT;
        
        RAISE NOTICE 'Coluna foto_perfil adicionada à tabela profiles';
    ELSE
        RAISE NOTICE 'Coluna foto_perfil já existe na tabela profiles';
    END IF;
    
    -- Verificar se a coluna nickname existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'nickname'
    ) THEN
        -- Adicionar a coluna nickname
        ALTER TABLE profiles ADD COLUMN nickname TEXT;
        
        RAISE NOTICE 'Coluna nickname adicionada à tabela profiles';
    ELSE
        RAISE NOTICE 'Coluna nickname já existe na tabela profiles';
    END IF;
END $$;

-- Atualizar a política RLS para incluir as novas colunas
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recriar as políticas com as novas colunas
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON COLUMN profiles.foto_perfil IS 'URL da foto de perfil do usuário';
COMMENT ON COLUMN profiles.nickname IS 'Apelido ou nome curto do usuário';
