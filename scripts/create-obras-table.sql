-- Create obras table for storing project/work information
CREATE TABLE IF NOT EXISTS obras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  endereco TEXT,
  data_inicio DATE,
  data_previsao DATE,
  valor DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'concluida', 'pausada')),
  observacoes TEXT,
  imagem_principal TEXT,
  galeria TEXT[],
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  atendente VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for obras table
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert their own records
CREATE POLICY "Users can insert their own obras" ON obras
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to view all obras
CREATE POLICY "Users can view all obras" ON obras
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for users to update their own obras
CREATE POLICY "Users can update their own obras" ON obras
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own obras
CREATE POLICY "Users can delete their own obras" ON obras
  FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for obras images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('obras', 'obras', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for obras bucket
CREATE POLICY "Anyone can view obras images" ON storage.objects
  FOR SELECT USING (bucket_id = 'obras');

CREATE POLICY "Authenticated users can upload obras images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'obras' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own obras images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'obras' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own obras images" ON storage.objects
  FOR DELETE USING (bucket_id = 'obras' AND auth.uid()::text = (storage.foldername(name))[1]);
