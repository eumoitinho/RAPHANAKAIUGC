'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTUSUpload } from '@/hooks/use-tus-upload'
import { VideoThumbnailSelector } from '@/components/upload/video-thumbnail-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { UploadCloud, CheckCircle, AlertCircle, Film, Image as ImageIcon, PartyPopper } from 'lucide-react'

// Categorias Centrais do seu negócio
const CATEGORIES = [
  { id: 'ensaio-feminino', name: 'Ensaio Feminino' },
  { id: 'ensaio-casal', name: 'Ensaio de Casal' },
  { id: 'casamento', name: 'Casamento' },
  { id: 'ensaio-gestante', name: 'Ensaio Gestante' },
  { id: 'evento', name: 'Evento' },
  { id: 'outro', name: 'Outro' },
]

export default function AdminUploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null)
  
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  
  const { uploadFile: tusUpload, uploading, progress, error } = useTUSUpload()
  
  const [status, setStatus] = useState<'idle' | 'uploading-video' | 'uploading-thumbnail' | 'saving' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [resultUrl, setResultUrl] = useState('')

  // Lógica de Login Anônimo Automático
  useEffect(() => {
    const ensureAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Sessão não encontrada. Realizando login anônimo...');
        await supabase.auth.signInAnonymously();
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
      setResultUrl('')
    } else {
      setStatus('error')
      setStatusMessage('Por favor, selecione um arquivo de vídeo válido.')
      setVideoFile(null)
    }
  }

  const handleUpload = useCallback(async () => {
    if (!videoFile || !thumbnailBlob || !title || !category) {
      setStatus('error')
      setStatusMessage('Preencha todos os campos: vídeo, thumbnail, título e categoria.')
      return
    }

    setStatus('uploading-video')
    setStatusMessage('Enviando vídeo principal...')

    try {
      const videoFileExt = videoFile.name.split('.').pop() || 'mp4'
      const videoFileName = `uploads/videos/${Date.now()}.${videoFileExt}`
      const videoResult = await tusUpload({
        file: videoFile,
        bucketName: 'media',
        fileName: videoFileName,
      })

      setStatus('uploading-thumbnail')
      setStatusMessage('Enviando thumbnail...')
      const thumbnailFileName = `uploads/thumbnails/${Date.now()}.jpg`
      const thumbnailFile = new File([thumbnailBlob], thumbnailFileName, { type: 'image/jpeg' })
      const thumbnailResult = await tusUpload({
        file: thumbnailFile,
        bucketName: 'media',
        fileName: thumbnailFileName,
      })

      setStatus('saving')
      setStatusMessage('Salvando informações no banco de dados...')
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

      if (!response.ok) throw new Error(await response.text())

      setStatus('success')
      setStatusMessage(`O vídeo "${title}" foi publicado com sucesso!`)
      setResultUrl(videoResult.url) // Assumindo que a URL do vídeo é a principal
      setVideoFile(null)

    } catch (e: any) {
      console.error('❌ Erro no processo de upload:', e)
      setStatus('error')
      setStatusMessage(e.message || 'Ocorreu um erro desconhecido durante o upload.')
    }
  }, [videoFile, thumbnailBlob, title, category, tusUpload])

  const resetForm = () => {
    setVideoFile(null)
    setThumbnailBlob(null)
    setTitle('')
    setCategory('')
    setStatus('idle')
    setResultUrl('')
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        
        {!videoFile && status !== 'success' && (
          <div className="text-center py-20">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
              Uploader de Mídia
            </h1>
            <p className="mt-4 text-lg text-gray-400">Selecione um vídeo para iniciar o processo de upload.</p>
            <div className="mt-10">
              <Label htmlFor="video-upload-main" className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-lg cursor-pointer text-lg shadow-lg transition-transform transform hover:scale-105">
                <UploadCloud className="w-6 h-6 mr-3" />
                Selecionar Vídeo
              </Label>
              <Input id="video-upload-main" type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-20 bg-[#111] rounded-xl border border-green-500/30">
            <PartyPopper className="w-16 h-16 mx-auto text-green-400" />
            <h2 className="mt-6 text-3xl font-bold text-green-400">Upload Concluído!</h2>
            <p className="mt-2 text-gray-300">{statusMessage}</p>
            {resultUrl && (
              <a href={resultUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-pink-400 underline">Ver vídeo publicado</a>
            )}
            <Button onClick={resetForm} className="mt-8">Enviar outro vídeo</Button>
          </div>
        )}

        {videoFile && status !== 'success' && (
          <div className="space-y-10">
            <div className="text-left">
              <h1 className="text-3xl font-bold tracking-tight text-white">Publicar Novo Vídeo</h1>
              <p className="mt-2 text-md text-gray-400">Siga os 3 passos para publicar seu vídeo com a melhor qualidade.</p>
            </div>

            <div className="bg-[#1c1c1c] border border-[#333] rounded-lg p-6 space-y-6">
              <Label className="text-xl font-semibold text-white flex items-center gap-2">
                <Film className="w-6 h-6 text-[#d87093]" />
                Passo 1: Selecione o Vídeo
              </Label>
              <div className="flex items-center space-x-4">
                <p className="text-md text-green-400 bg-green-900/50 px-3 py-1 rounded-md">{(videoFile.size / 1024 / 1024).toFixed(2)} MB - {videoFile.name}</p>
                <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
              </div>
            </div>

            <div className="bg-[#1c1c1c] border border-[#333] rounded-lg p-6 space-y-6">
              <Label className="text-xl font-semibold text-white flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-[#d87093]" />
                Passo 2: Gere e Selecione a Thumbnail
              </Label>
              <VideoThumbnailSelector videoFile={videoFile} onThumbnailSelected={setThumbnailBlob} />
            </div>

            {thumbnailBlob && (
              <div className="bg-[#1c1c1c] border border-[#333] rounded-lg p-6 space-y-6">
                <Label className="text-xl font-semibold text-white">Passo 3: Adicione os Detalhes Finais</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                        <Label htmlFor="title" className="text-gray-300">Título do Vídeo</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ensaio criativo na Av. Paulista" className="mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="category" className="text-gray-300">Categoria Principal</Label>
                        <Select onValueChange={setCategory} value={category}>
                        <SelectTrigger id="category" className="mt-1">
                            <SelectValue placeholder="Selecione a categoria do projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
            )}
            
            {title && category && thumbnailBlob && (
              <div className="pt-6 space-y-4">
                <Button onClick={handleUpload} disabled={uploading} className="w-full font-bold py-4 px-4 rounded-lg text-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? `Enviando... ${progress}%` : 'Publicar Vídeo'}
                  <UploadCloud className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}
            
            {uploading && (
              <div className="text-center p-4 bg-[#1c1c1c] rounded-lg border border-yellow-500/30">
                <p className="text-yellow-400 font-medium">{statusMessage}</p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {status === 'error' && (
                <div className="p-4 bg-red-900/50 rounded-lg border border-red-500/50 text-center">
                    <AlertCircle className="h-6 w-6 mx-auto text-red-400 mb-2" />
                    <h3 className="text-lg font-bold text-red-400">Ocorreu um Erro</h3>
                    <p className="text-red-300">{statusMessage || error}</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
