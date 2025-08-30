'use client'

import { useState, useCallback } from 'react'
import { useTUSUpload } from '@/hooks/use-tus-upload'
import { VideoThumbnailSelector } from '@/components/upload/video-thumbnail-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UploadCloud, CheckCircle, AlertCircle, Film, Image as ImageIcon } from 'lucide-react'

export default function AdminUploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  
  const { uploadFile: tusUpload, uploading, progress, error } = useTUSUpload()
  
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      setTitle(file.name.split('.').slice(0, -1).join('.')) // Pre-fill title
      setStatus('idle')
      setThumbnailBlob(null)
    } else {
      setStatus('error')
      setStatusMessage('Por favor, selecione um arquivo de vídeo válido.')
      setVideoFile(null)
    }
  }

  const handleUpload = useCallback(async () => {
    if (!videoFile || !thumbnailBlob || !title || !category) {
      setStatus('error')
      setStatusMessage('Todos os campos são obrigatórios: vídeo, thumbnail, título e categoria.')
      return
    }

    setStatus('uploading')
    setStatusMessage('Iniciando upload...')

    try {
      // 1. Upload do vídeo
      setStatusMessage(`Fazendo upload do vídeo... ${progress}%`)
      const videoFileExt = videoFile.name.split('.').pop() || 'mp4'
      const videoFileName = `uploads/videos/${Date.now()}.${videoFileExt}`
      const videoResult = await tusUpload({
        file: videoFile,
        bucketName: 'media',
        fileName: videoFileName,
      })
      console.log('✅ Vídeo uploaded:', videoResult.url)

      // 2. Upload da thumbnail
      setStatusMessage('Fazendo upload da thumbnail...')
      const thumbnailFileName = `uploads/thumbnails/${Date.now()}.jpg`
      const thumbnailFile = new File([thumbnailBlob], thumbnailFileName, { type: 'image/jpeg' })
      const thumbnailResult = await tusUpload({
        file: thumbnailFile,
        bucketName: 'media',
        fileName: thumbnailFileName,
      })
      console.log('✅ Thumbnail uploaded:', thumbnailResult.url)

      // 3. Salvar metadados no banco
      setStatusMessage('Salvando informações...')
      const response = await fetch('/api/save-media-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          video_url: videoResult.url,
          thumbnail_url: thumbnailResult.url,
          video_path: videoResult.path,
          thumbnail_path: thumbnailResult.path,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao salvar metadados.')
      }

      const finalData = await response.json()
      console.log('✅ Metadados salvos:', finalData)

      setStatus('success')
      setStatusMessage(`Vídeo "${title}" enviado com sucesso!`)
      // Reset form
      setVideoFile(null)
      setTitle('')
      setCategory('')

    } catch (e: any) {
      console.error('❌ Erro no processo de upload:', e)
      setStatus('error')
      setStatusMessage(e.message || 'Ocorreu um erro desconhecido.')
    }
  }, [videoFile, thumbnailBlob, title, category, tusUpload])

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Upload de Mídia</h1>
          <p className="mt-2 text-lg text-gray-400">Envie e gerencie seus vídeos e thumbnails.</p>
        </div>

        {/* Bloco de Upload */}
        <div className="bg-[#1c1c1c] border border-[#333] rounded-lg p-6 space-y-6">
          {/* Passo 1: Selecionar Vídeo */}
          <div>
            <Label htmlFor="video-upload" className="text-lg font-medium text-white flex items-center gap-2 mb-2">
              <Film className="w-5 h-5 text-[#d87093]" />
              Passo 1: Selecionar Vídeo
            </Label>
            <div className="flex items-center space-x-4">
              <Input id="video-upload" type="file" accept="video/*" onChange={handleFileChange} className="flex-grow" />
              {videoFile && (
                <Button variant="outline" size="sm" onClick={() => setVideoFile(null)}>Trocar Vídeo</Button>
              )}
            </div>
            {videoFile && <p className="text-sm text-gray-400 mt-2">Selecionado: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)</p>}
          </div>

          {/* Passo 2: Selecionar Thumbnail */}
          {videoFile && (
            <div>
              <Label className="text-lg font-medium text-white flex items-center gap-2 mb-2">
                <ImageIcon className="w-5 h-5 text-[#d87093]" />
                Passo 2: Gerar Thumbnail
              </Label>
              <VideoThumbnailSelector videoFile={videoFile} onThumbnailSelected={setThumbnailBlob} />
            </div>
          )}

          {/* Passo 3: Informações */}
          {videoFile && thumbnailBlob && (
            <div className="space-y-4">
                <Label className="text-lg font-medium text-white">Passo 3: Adicionar Detalhes</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="title">Título do Vídeo</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ensaio na Praia" />
                    </div>
                    <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Select onValueChange={setCategory} value={category}>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ensaio-feminino">Ensaio Feminino</SelectItem>
                            <SelectItem value="ensaio-casal">Ensaio de Casal</SelectItem>
                            <SelectItem value="casamento">Casamento</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
          )}
          
          {/* Botão de Upload e Progresso */}
          {videoFile && thumbnailBlob && title && category && (
             <div className="pt-4 space-y-4">
                <Button onClick={handleUpload} disabled={status === 'uploading'} className="w-full bg-[#d87093] hover:bg-[#c45c7c] text-white font-bold py-3 px-4 rounded-lg text-lg">
                  {status === 'uploading' ? 'Enviando...' : 'Enviar Vídeo e Thumbnail'}
                  <UploadCloud className="ml-2 w-5 h-5" />
                </Button>
                
                {status === 'uploading' && (
                    <div className="space-y-2">
                        <p className="text-center text-sm text-gray-300">{statusMessage}</p>
                        <Progress value={progress} className="w-full" />
                    </div>
                )}
            </div>
          )}

            {/* Alertas de Status */}
            {status === 'success' && (
                <Alert variant="default" className="bg-green-900/50 border-green-700 text-green-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertTitle>Sucesso!</AlertTitle>
                    <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
            )}
            {status === 'error' && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro no Upload</AlertTitle>
                    <AlertDescription>{statusMessage || error}</AlertDescription>
                </Alert>
            )}
        </div>
      </div>
    </div>
  )
}
