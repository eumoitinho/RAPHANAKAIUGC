-- Criar tabela de mídia no Supabase
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_type TEXT CHECK (file_type IN ('video', 'photo')) NOT NULL,
  categories TEXT[] DEFAULT '{}',
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  file_name TEXT,
  file_size BIGINT,
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  supabase_path TEXT,
  supabase_thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_media_file_type ON media(file_type);
CREATE INDEX IF NOT EXISTS idx_media_date_created ON media(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_media_views ON media(views DESC);

-- Criar função para incrementar views
CREATE OR REPLACE FUNCTION increment_views(media_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE media 
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = media_id;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_updated_at 
BEFORE UPDATE ON media
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública
CREATE POLICY "Allow public read access" ON media
  FOR SELECT USING (true);

-- Criar política para permitir inserção apenas autenticada (se necessário)
CREATE POLICY "Allow authenticated insert" ON media
  FOR INSERT WITH CHECK (true);

-- Criar política para permitir update apenas autenticada (se necessário) 
CREATE POLICY "Allow authenticated update" ON media
  FOR UPDATE USING (true);

-- Criar política para permitir delete apenas autenticada (se necessário)
CREATE POLICY "Allow authenticated delete" ON media
  FOR DELETE USING (true);