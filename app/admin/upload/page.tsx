'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTUSUpload } from '@/hooks/use-tus-upload'
import { supabase } from '@/lib/supabase'
import { VideoThumbnailSelector } from '@/components/upload/video-thumbnail-selector'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Film, Image as ImageIcon } from 'lucide-react'

const CATEGORIES = [
  { id: 'ads', name: 'ADS' },
  { id: 'wellness', name: 'Wellness' },
  { id: 'receitas', name: 'Receitas' },
  { id: 'moda', name: 'Moda' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'decor', name: 'Decor' },
  { id: 'experiencia', name: 'Experiência' },
  { id: 'pet', name: 'Pet' },
  { id: 'viagem', name: 'Viagem' },
];

export default function AdminUploadMediaPage() {
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState<'video' | 'image' | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  
  const { uploadFile, uploading, progress, error: tusError } = useTUSUpload()

  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(true)

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
        }
      } catch (error: any) {
        setStatus('error');
        setStatusMessage(`Falha crítica na autenticação: ${error.message}. Verifique as configurações no Supabase.`);
      } finally {
        setIsAuthenticating(false);
      }
    };
    ensureAuth();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return;

    resetFormState();
    setTitle(file.name.split('.').slice(0, -1).join(' ').replace(/[-_]/g, ' '))
    setMediaFile(file);

    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else if (file.type.startsWith('image/')) {
      setMediaType('image');
      setThumbnailBlob(file); // Para fotos, a própria imagem é a thumbnail
    } else {
      setMediaType(null);
      setMediaFile(null);
      alert("Tipo de arquivo não suportado. Por favor, selecione um vídeo ou uma imagem.");
    }
  }

  const resetFormState = () => {
    setMediaFile(null)
    setMediaType(null)
    setThumbnailBlob(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setStatus('idle')
  }
  
  const resetForNewUpload = () => {
    resetFormState()
    // Mantém a autenticação, não precisa rodar de novo
    const fileInput = document.getElementById('media-file') as HTMLInputElement;
    if(fileInput) fileInput.value = "";
  }


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mediaFile || !thumbnailBlob || !title || !category || !mediaType) {
      setStatus('error')
      setStatusMessage('Todos os campos são obrigatórios: Mídia, Título e Categoria.')
      return
    }

    setStatus('uploading')

    try {
      // Definir buckets e caminhos com base no tipo de mídia
      const isVideo = mediaType === 'video';
      const mainBucket = isVideo ? 'videos' : 'images';
      const mainFileExt = mediaFile.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const mainFileName = `uploads/${mainBucket}/${Date.now()}.${mainFileExt}`;
      
      // 1. Upload do arquivo principal (vídeo ou imagem)
      setStatusMessage(`Enviando ${mediaType}...`)
      const mainResult = await uploadFile({ file: mediaFile, bucketName: mainBucket, fileName: mainFileName })

      // 2. Upload da thumbnail
      setStatusMessage('Enviando a thumbnail...')
      const thumbnailFileName = `uploads/thumbnails/${Date.now()}.jpg`
      const thumbnailFile = new File([thumbnailBlob], thumbnailFileName, { type: 'image/jpeg' })
      const thumbnailResult = await uploadFile({ file: thumbnailFile, bucketName: 'thumbnails', fileName: thumbnailFileName })

      // 3. Salvar metadados no banco
      setStatusMessage('Salvando informações...')
      const response = await fetch('/api/save-media-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, 
          description, 
          category, 
          item_type: mediaType,
          // Para fotos, a "video_url" será a URL da imagem.
          video_url: mainResult.url, 
          thumbnail_url: thumbnailResult.url,
          // Para fotos, o "video_path" será o path da imagem.
          video_path: mainResult.path, 
          thumbnail_path: thumbnailResult.path, 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao salvar metadados.')
      }

      setStatus('success')
      setStatusMessage(`"${title}" enviado com sucesso!`)

    } catch (err: any) {
      console.error('❌ Erro no processo de upload:', err)
      setStatus('error')
      setStatusMessage(err.message || tusError || 'Ocorreu um erro desconhecido.')
    }
  }, [mediaFile, mediaType, thumbnailBlob, title, description, category, uploadFile, tusError])

  const isSubmitDisabled = uploading || !mediaFile || !thumbnailBlob || isAuthenticating;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {status !== 'success' ? (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Conteúdo</CardTitle>
              <CardDescription>Preencha as informações da sua mídia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <fieldset disabled={isAuthenticating || uploading}>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" placeholder="Título do conteúdo" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" placeholder="Descreva os detalhes..." value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select onValueChange={setCategory} value={category} required>
                    <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </fieldset>
              <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                {isAuthenticating && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Autenticando...</>}
                {uploading && !isAuthenticating && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{`Enviando... ${progress}%`}</>}
                {!uploading && !isAuthenticating && <><UploadCloud className="mr-2 h-4 w-4" />Publicar Conteúdo</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mídia</CardTitle>
              <CardDescription>Selecione um vídeo ou uma foto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <fieldset disabled={isAuthenticating || uploading}>
                <div className="space-y-2">
                  <Label htmlFor="media-file">Arquivo (Vídeo ou Foto)</Label>
                  <Input id="media-file" type="file" accept="video/*,image/*" onChange={handleFileChange} required />
                  {mediaType === 'video' && mediaFile && <p className="text-sm text-green-500 flex items-center"><Film className="w-4 h-4 mr-2"/>Vídeo selecionado: {mediaFile.name}</p>}
                  {mediaType === 'image' && mediaFile && <p className="text-sm text-green-500 flex items-center"><ImageIcon className="w-4 h-4 mr-2"/>Foto selecionada: {mediaFile.name}</p>}
                </div>
                {mediaType === 'video' && mediaFile && (
                  <div className="space-y-4">
                      <Label>Gerador de Thumbnail</Label>
                      <VideoThumbnailSelector videoFile={mediaFile} onThumbnailSelected={setThumbnailBlob} />
                      {thumbnailBlob && <p className="text-sm text-green-500">Thumbnail gerada com sucesso!</p>}
                  </div>
                )}
              </fieldset>
              {uploading && (
                <div className="space-y-2 pt-4">
                  <Label>{statusMessage}</Label>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">{progress}%</p>
                </div>
              )}
              {status === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Ocorreu um Erro</AlertTitle>
                    <AlertDescription>{statusMessage}</AlertDescription>
                  </Alert>
              )}
            </CardContent>
          </Card>
        </form>
      ) : (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="items-center text-center">
                <CheckCircle className="w-16 h-16 text-green-500"/>
                <CardTitle className="text-2xl">Publicado com Sucesso!</CardTitle>
                <CardDescription>{statusMessage}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={resetForNewUpload} className="w-full">Enviar outra mídia</Button>
            </CardContent>
        </Card>
      )}
    </main>
  )
}
