-- Criar bucket temporário para chunks do iPhone
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp',
  'temp',
  false,
  1073741824, -- 1GB
  NULL -- Aceitar todos os tipos
)
ON CONFLICT (id) DO NOTHING;

-- Permitir operações no bucket temp
CREATE POLICY "Allow all operations on temp bucket" ON storage.objects
  FOR ALL
  USING (bucket_id = 'temp')
  WITH CHECK (bucket_id = 'temp');

-- Criar job para limpar arquivos antigos (opcional)
-- Arquivos no temp devem ser deletados após 1 hora
CREATE OR REPLACE FUNCTION clean_temp_storage()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp' 
  AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Comentário: Execute este SQL no Supabase Dashboard > SQL Editor