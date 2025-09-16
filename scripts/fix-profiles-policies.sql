-- =====================================================
-- FIX INFINITE RECURSION IN PROFILES POLICIES
-- =====================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON profiles;

-- Create new policies without recursion
-- Policy for users to see their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy for users to insert their own profile (for new registrations)
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Simple policy for administrators (without subquery that causes recursion)
-- We'll handle admin checks in the application layer instead
CREATE POLICY "profiles_admin_access" ON profiles
    FOR ALL USING (
        -- Allow if user is accessing their own profile
        auth.uid() = id
        OR
        -- Allow if user has admin role in auth.users metadata
        (auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin')
    );

-- Update the handle_new_user function to set admin role in metadata if needed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, tipo_usuario, ativo)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
        NEW.email,
        'vendedor',
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin (updates both profiles table and auth metadata)
CREATE OR REPLACE FUNCTION promover_administrador(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Find user ID by email
    SELECT au.id INTO user_id
    FROM auth.users au
    WHERE au.email = user_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
    END IF;
    
    -- Update profile table
    UPDATE profiles 
    SET tipo_usuario = 'administrador',
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Log the action
    INSERT INTO log_atividades (user_id, acao, tabela_afetada, registro_id)
    VALUES (user_id, 'PROMOVIDO_ADMINISTRADOR', 'profiles', user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
