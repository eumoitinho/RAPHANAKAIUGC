-- Script para criar o bucket de vídeos no Supabase Storage
-- Execute este SQL no Supabase Dashboard -> SQL Editor

-- Criar bucket para vídeos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos', 
  true,
  524288000, -- 500MB
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/x-matroska']
)
ON CONFLICT (id) DO NOTHING;

-- Criar política de leitura pública para o bucket de vídeos
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

-- Criar política de upload para usuários autenticados (ou anônimos se preferir)
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos');

-- Criar política de update
CREATE POLICY "Allow updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'videos');

-- Criar política de delete
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'videos');