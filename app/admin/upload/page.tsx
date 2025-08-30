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
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

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

export default function AdminUploadFinalPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
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
          console.log('Sessão não encontrada. Realizando login anônimo...');
          const { error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          console.log('Login anônimo bem-sucedido.');
        }
      } catch (error: any) {
        console.error('Falha no processo de autenticação anônima:', error);
        setStatus('error');
        setStatusMessage(`Falha crítica na autenticação: ${error.message}. Por favor, recarregue a página.`);
      } finally {
        setIsAuthenticating(false);
      }
    };
    ensureAuth();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      setTitle(file.name.split('.').slice(0, -1).join(' ').replace(/[-_]/g, ' '))
      setStatus('idle')
      setThumbnailBlob(null)
    } else {
      setVideoFile(null)
      alert("Por favor, selecione um arquivo de vídeo.")
    }
  }

  const resetForm = () => {
    setVideoFile(null)
    setThumbnailBlob(null)
    setTitle('')
    setDescription('')
    setCategory('')
    setStatus('idle')
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile || !thumbnailBlob || !title || !category) {
      setStatus('error')
      setStatusMessage('Todos os campos são obrigatórios: Vídeo, Thumbnail, Título e Categoria.')
      return
    }

    setStatus('uploading')

    try {
      setStatusMessage('Enviando o vídeo...')
      const videoFileExt = videoFile.name.split('.').pop() || 'mp4'
      const videoFileName = `uploads/videos/${Date.now()}.${videoFileExt}`
      const videoResult = await uploadFile({ file: videoFile, bucketName: 'media', fileName: videoFileName })

      setStatusMessage('Enviando a thumbnail...')
      const thumbnailFileName = `uploads/thumbnails/${Date.now()}.jpg`
      const thumbnailFile = new File([thumbnailBlob], thumbnailFileName, { type: 'image/jpeg' })
      const thumbnailResult = await uploadFile({ file: thumbnailFile, bucketName: 'media', fileName: thumbnailFileName })

      setStatusMessage('Salvando informações...')
      const response = await fetch('/api/save-media-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, video_url: videoResult.url, thumbnail_url: thumbnailResult.url, video_path: videoResult.path, thumbnail_path: thumbnailResult.path }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao salvar metadados.')
      }

      setStatus('success')
      setStatusMessage(`Vídeo "${title}" enviado com sucesso!`)

    } catch (err: any) {
      console.error('❌ Erro no processo de upload:', err)
      setStatus('error')
      setStatusMessage(err.message || tusError || 'Ocorreu um erro desconhecido.')
    }
  }, [videoFile, thumbnailBlob, title, description, category, uploadFile, tusError])

  const isSubmitDisabled = uploading || !videoFile || !thumbnailBlob || isAuthenticating;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {status !== 'success' ? (
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Conteúdo</CardTitle>
              <CardDescription>Preencha as informações do seu vídeo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <fieldset disabled={isAuthenticating || uploading}>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" placeholder="Título principal do vídeo" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" placeholder="Descreva os detalhes do seu trabalho..." value={description} onChange={(e) => setDescription(e.target.value)} />
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
                {!uploading && !isAuthenticating && <><UploadCloud className="mr-2 h-4 w-4" />Publicar Conteúdo</>}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mídia</CardTitle>
              <CardDescription>Selecione o vídeo e depois gere a thumbnail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <fieldset disabled={isAuthenticating || uploading}>
                <div className="space-y-2">
                  <Label htmlFor="video-file">Arquivo de Vídeo (Até 2GB)</Label>
                  <Input id="video-file" type="file" accept="video/*" onChange={handleFileChange} required />
                  {videoFile && <p className="text-sm text-green-500">Vídeo selecionado: {videoFile.name}</p>}
                </div>
                {videoFile && (
                  <div className="space-y-4">
                      <Label>Gerador de Thumbnail</Label>
                      <VideoThumbnailSelector videoFile={videoFile} onThumbnailSelected={setThumbnailBlob} />
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
                <Button onClick={resetForm} className="w-full">Enviar outro vídeo</Button>
            </CardContent>
        </Card>
      )}
    </main>
  )
}
