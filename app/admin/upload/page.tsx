'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTUSUpload } from '@/hooks/use-tus-upload'
import { supabase } from '@/lib/supabase'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react'

const CATEGORIES = [
  { id: 'ensaio-feminino', name: 'Ensaio Feminino' },
  { id: 'ensaio-casal', name: 'Ensaio de Casal' },
  { id: 'casamento', name: 'Casamento' },
  { id: 'ensaio-gestante', name: 'Ensaio Gestante' },
  { id: 'evento', name: 'Evento' },
  { id: 'outro', name: 'Outro' },
]

export default function AdminUploadPageOriginal() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  
  const { uploadFile, uploading, progress, error: tusError } = useTUSUpload()

  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Autenticação anônima e automática
  useEffect(() => {
    const ensureAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Sessão não encontrada. Realizando login anônimo automático...');
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
            console.error('Falha no login anônimo:', error);
            setStatus('error');
            setStatusMessage(`Falha na autenticação automática: ${error.message}`);
        }
      }
    };
    ensureAuth();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setTitle(selectedFile.name.split('.').slice(0, -1).join(' ').replace(/[-_]/g, ' '))
      setStatus('idle')
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title || !category) {
      setStatus('error')
      setStatusMessage('Todos os campos são obrigatórios.')
      return
    }

    setStatus('uploading')
    setStatusMessage('Iniciando upload com TUS...')

    try {
      const fileExt = file.name.split('.').pop() || 'mp4'
      const videoFileName = `uploads/videos/${Date.now()}.${fileExt}`
      
      // Upload do vídeo principal com TUS
      const videoResult = await uploadFile({
        file: file,
        bucketName: 'media',
        fileName: videoFileName,
      })

      // A thumbnail será gerada pela VPS/backend, então não precisamos enviá-la aqui.
      // Apenas salvamos os metadados.
      setStatusMessage('Salvando informações do vídeo...')
      const response = await fetch('/api/save-media-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          video_url: videoResult.url,
          video_path: videoResult.path,
          // A thumbnail_url e thumbnail_path serão adicionadas pelo backend após o processamento
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Falha ao salvar os dados.')
      }

      setStatus('success')
      setStatusMessage(`Vídeo "${title}" enviado com sucesso! Ele será processado em breve.`)
      // Limpar formulário
      setFile(null)
      setTitle('')
      setCategory('')

    } catch (err: any) {
      console.error('❌ Erro no processo de upload:', err)
      setStatus('error')
      setStatusMessage(err.message || tusError || 'Ocorreu um erro desconhecido.')
    }
  }, [file, title, category, uploadFile, tusError])

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Vídeo</CardTitle>
            <CardDescription>
              Envie um novo vídeo para o portfólio. O sistema usará TUS para uploads robustos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Vídeo</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Ensaio de verão na praia"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select onValueChange={setCategory} value={category} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-file">Arquivo de Vídeo</Label>
                <Input id="video-file" type="file" accept="video/*" onChange={handleFileChange} required />
                {file && <p className="text-sm text-muted-foreground">Selecionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
              </div>

              <Button type="submit" className="w-full" disabled={uploading || !file}>
                {uploading ? `Enviando... ${progress}%` : "Enviar Vídeo"}
                <UploadCloud className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Status do Upload</CardTitle>
            <CardDescription>Acompanhe o processo de envio aqui.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="w-full space-y-4 text-center">
              {status === 'idle' && <p className="text-muted-foreground">Aguardando o envio de um arquivo...</p>}
              
              {uploading && (
                <div className="space-y-2">
                  <p className="font-medium">Enviando o vídeo...</p>
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{progress}% concluído</p>
                </div>
              )}

              {status === 'success' && (
                <Alert className="border-green-500 text-green-500">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Sucesso!</AlertTitle>
                  <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
              )}

              {status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro no Upload</AlertTitle>
                  <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
