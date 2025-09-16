-- Enable RLS on obras table if not already enabled
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all obras" ON obras;
DROP POLICY IF EXISTS "Users can insert their own obras" ON obras;
DROP POLICY IF EXISTS "Users can update their own obras" ON obras;
DROP POLICY IF EXISTS "Users can delete their own obras" ON obras;
DROP POLICY IF EXISTS "Admins and vendedores can update all obras" ON obras;
DROP POLICY IF EXISTS "Admins and vendedores can delete all obras" ON obras;

-- Allow all authenticated users to view obras (for public links)
CREATE POLICY "Users can view all obras" ON obras
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Allow users to insert their own obras
CREATE POLICY "Users can insert their own obras" ON obras
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow administrators and vendedores to update any obra
CREATE POLICY "Admins and vendedores can update all obras" ON obras
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.tipo_usuario = 'administrador' OR profiles.tipo_usuario = 'vendedor')
        )
    );

-- Allow administrators and vendedores to delete any obra
CREATE POLICY "Admins and vendedores can delete all obras" ON obras
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.tipo_usuario = 'administrador' OR profiles.tipo_usuario = 'vendedor')
        )
    );

-- Allow users to update their own obras (fallback for regular users)
CREATE POLICY "Users can update their own obras" ON obras
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to delete their own obras (fallback for regular users)
CREATE POLICY "Users can delete their own obras" ON obras
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
