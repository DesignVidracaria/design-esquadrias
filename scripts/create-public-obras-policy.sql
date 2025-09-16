-- Create RLS policy to allow public read access to obras table
-- Enable RLS on obras table if not already enabled
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to all obras
CREATE POLICY "Allow public read access to obras" ON obras
FOR SELECT
TO anon, authenticated
USING (true);

-- Grant select permission to anonymous users
GRANT SELECT ON obras TO anon;
