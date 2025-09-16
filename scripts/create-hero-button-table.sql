-- Create hero_button table for storing homepage button data
CREATE TABLE IF NOT EXISTS public.hero_button (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  link VARCHAR(500) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.hero_button ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.hero_button
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert a default button if none exists
INSERT INTO public.hero_button (titulo, link, ativo) 
VALUES ('Ver Portfólio', '#portfolio', true)
ON CONFLICT DO NOTHING;
