"use client"

import { useState, useEffect } from "react"
import { Trash2, Eye, Download, FileVideo, FileImage, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteFile, STORAGE_BUCKETS } from "@/lib/supabase"

type MediaItem = {
  id: string
  title: string
  description: string
  file_url: string
  thumbnail_url: string
  file_type: 'video' | 'photo'
  categories: string[]
  date_created: string
  views: number
  file_name: string
  file_size: number
  supabase_path?: string
  supabase_thumbnail_path?: string
}

export function SupabaseMediaManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'photo'>('all')
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null)

  const fetchMedia = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/upload-supabase')
      if (!response.ok) throw new Error('Failed to fetch media')
      
      const data = await response.json()
      setMediaItems(data.media || [])
    } catch (error) {
      console.error('Error fetching media:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar mídia do Supabase",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  const handleDelete = async (item: MediaItem) => {
    try {
      // Deletar arquivos do Supabase Storage
      const filesToDelete = []
      
      if (item.supabase_path) {
        const bucket = item.file_type === 'video' ? STORAGE_BUCKETS.VIDEOS : STORAGE_BUCKETS.IMAGES
        filesToDelete.push({ bucket, path: item.supabase_path })
      }
      
      if (item.supabase_thumbnail_path) {
        filesToDelete.push({ bucket: STORAGE_BUCKETS.THUMBNAILS, path: item.supabase_thumbnail_path })
      }

      // Deletar arquivos do Storage
      for (const file of filesToDelete) {
        await deleteFile(file.bucket, [file.path])
      }

      // Deletar do Supabase Database
      const response = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })

      if (!response.ok) throw new Error('Failed to delete from database')

      toast({
        title: "Sucesso",
        description: "Mídia removida com sucesso",
      })

      // Atualizar lista
      fetchMedia()
    } catch (error) {
      console.error('Error deleting media:', error)
      toast({
        title: "Erro",
        description: "Falha ao remover mídia",
        variant: "destructive",
      })
    }
    
    setItemToDelete(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || item.file_type === selectedType
    
    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por título, descrição ou arquivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#252525] border-gray-700"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={selectedType === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedType('all')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={selectedType === 'video' ? 'default' : 'outline'}
            onClick={() => setSelectedType('video')}
            size="sm"
          >
            <FileVideo className="w-4 h-4 mr-1" />
            Vídeos
          </Button>
          <Button
            variant={selectedType === 'photo' ? 'default' : 'outline'}
            onClick={() => setSelectedType('photo')}
            size="sm"
          >
            <FileImage className="w-4 h-4 mr-1" />
            Fotos
          </Button>
        </div>

        <Button onClick={fetchMedia} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#252525] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total de Arquivos</p>
          <p className="text-2xl font-bold">{mediaItems.length}</p>
        </div>
        <div className="bg-[#252525] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Vídeos</p>
          <p className="text-2xl font-bold">{mediaItems.filter(i => i.file_type === 'video').length}</p>
        </div>
        <div className="bg-[#252525] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Fotos</p>
          <p className="text-2xl font-bold">{mediaItems.filter(i => i.file_type === 'photo').length}</p>
        </div>
        <div className="bg-[#252525] p-4 rounded-lg">
          <p className="text-sm text-gray-400">Visualizações Totais</p>
          <p className="text-2xl font-bold">{mediaItems.reduce((sum, item) => sum + item.views, 0)}</p>
        </div>
      </div>

      {/* Lista de Mídia */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Carregando mídia...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-[#252525] rounded-lg">
          <p className="text-gray-400">Nenhuma mídia encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-[#252525] rounded-lg overflow-hidden group">
              {/* Thumbnail */}
              <div className="aspect-[9/16] relative bg-gray-900">
                {item.file_type === 'video' ? (
                  <video
                    src={item.thumbnail_url || item.file_url}
                    className="w-full h-full object-cover"
                    muted
                    poster={item.thumbnail_url}
                  />
                ) : (
                  <img
                    src={item.thumbnail_url || item.file_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-5 h-5 text-white" />
                  </a>
                  <a
                    href={item.file_url}
                    download={item.file_name}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                    title="Baixar"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </a>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>

                {/* Badge do tipo */}
                <div className="absolute top-2 left-2">
                  {item.file_type === 'video' ? (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                      <FileVideo className="w-3 h-3 mr-1" />
                      Vídeo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                      <FileImage className="w-3 h-3 mr-1" />
                      Foto
                    </Badge>
                  )}
                </div>

                {/* Provider badge */}
                {true && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      Supabase
                    </Badge>
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="p-4">
                <h3 className="font-medium truncate">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-gray-400 truncate mt-1">{item.description}</p>
                )}
                
                {/* Categorias */}
                {item.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.categories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Metadados */}
                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  <p>📁 {formatFileSize(item.file_size)}</p>
                  <p>👁 {item.views} visualizações</p>
                  <p>📅 {formatDate(item.date_created)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Confirmação */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{itemToDelete?.title}"? 
              Esta ação não pode ser desfeita e removerá o arquivo do Supabase Storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handleDelete(itemToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}