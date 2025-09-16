-- Add missing autor_nickname column to blog_posts table
-- This column is required by the BlogPreview component

ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS autor_nickname TEXT;

-- Update existing records to have a default author nickname
-- You can update this later with actual author nicknames
UPDATE blog_posts 
SET autor_nickname = 'Admin' 
WHERE autor_nickname IS NULL;

-- Create an index for better performance when querying by author
CREATE INDEX IF NOT EXISTS idx_blog_posts_autor_nickname ON blog_posts(autor_nickname);
