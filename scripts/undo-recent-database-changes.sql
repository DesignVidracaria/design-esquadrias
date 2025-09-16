-- =====================================================
-- UNDO RECENT DATABASE CHANGES
-- Remove problematic triggers, functions, and policies
-- =====================================================

-- 1. DROP PROBLEMATIC TRIGGERS AND FUNCTIONS
-- =====================================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions that were causing issues
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(uuid, text, text) CASCADE;

-- 2. RESET RLS POLICIES ON PROFILES TABLE
-- =====================================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Disable RLS temporarily to avoid issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. CLEAN UP OTHER PROBLEMATIC POLICIES
-- =====================================================

-- Reset policies on other tables if they were modified
-- Blog posts policies
DROP POLICY IF EXISTS "blog_posts_select_all" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert_auth" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_update_own" ON blog_posts;

-- Create simple blog policies
CREATE POLICY "Enable read access for all users" ON blog_posts
    FOR SELECT USING (ativo = true);

CREATE POLICY "Enable insert for authenticated users" ON blog_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own posts" ON blog_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Portfolio items policies
DROP POLICY IF EXISTS "portfolio_items_select_all" ON portfolio_items;
DROP POLICY IF EXISTS "portfolio_items_insert_auth" ON portfolio_items;
DROP POLICY IF EXISTS "portfolio_items_update_own" ON portfolio_items;

-- Create simple portfolio policies
CREATE POLICY "Enable read access for all users" ON portfolio_items
    FOR SELECT USING (ativo = true);

CREATE POLICY "Enable insert for authenticated users" ON portfolio_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own items" ON portfolio_items
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. REMOVE PROBLEMATIC EXTENSIONS OR CONFIGURATIONS
-- =====================================================

-- Remove any custom types that might be causing issues
-- (Keep existing ones that are working)

-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify that problematic functions are removed
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('handle_new_user', 'is_admin', 'create_user_profile');

-- Verify policies are reset
SELECT policyname, tablename 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- Success message
SELECT 'Database cleanup completed successfully' as status;
