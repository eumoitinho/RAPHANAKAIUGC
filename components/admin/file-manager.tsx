"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Filter, 
  Grid, 
  List,
  Play,
  Download,
  Trash2,
  Eye,
  Calendar,
  FileVideo,
  FileImage,
  MoreVertical
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MediaFile {
  id: string
  title: string
  file_url: string
  thumbnail_url: string
  file_type: 'video' | 'photo'
  file_name: string
  file_size: number
  category: string
  created_at: string
  views: number
}

export function FileManager() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "video" | "photo">("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", "Wellness", "ADS", "Experiência", "Beauty", "Pet", "Decor", "Receitas", "Moda", "Viagem"]

  // Simular dados por enquanto
  useEffect(() => {
    // TODO: Implementar busca real no banco
    const simulatedFiles: MediaFile[] = [
      {
        id: "1",
        title: "Vídeo de exemplo",
        file_url: "/placeholder-video.mp4",
        thumbnail_url: "/placeholder-thumb.jpg",
        file_type: "video",
        file_name: "exemplo.mov",
        file_size: 850 * 1024 * 1024, // 850MB
        category: "Wellness",
        created_at: new Date().toISOString(),
        views: 0
      }
    ]
    
    setFiles(simulatedFiles)
    setFilteredFiles(simulatedFiles)
    setLoading(false)
  }, [])

  // Filtrar arquivos
  useEffect(() => {
    let filtered = files

    // Filtro por tipo
    if (filter !== "all") {
      filtered = filtered.filter(f => f.file_type === filter)
    }

    // Filtro por categoria
    if (selectedCategory !== "all") {
      filtered = filtered.filter(f => f.category === selectedCategory)
    }

    // Busca por texto
    if (search) {
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        f.file_name.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredFiles(filtered)
  }, [files, filter, selectedCategory, search])

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    } else {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return

    try {
      // TODO: Implementar exclusão real
      console.log(`Deletando arquivo ${fileId}`)
      
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      toast({
        title: "Arquivo excluído",
        description: "O arquivo foi removido com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o arquivo",
        variant: "destructive"
      })
    }
  }

  const handleDownload = (file: MediaFile) => {
    // Abrir arquivo em nova aba para download
    window.open(file.file_url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d87093]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="bg-[#1e1e1e] rounded-lg p-6 border border-[#333333]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por título ou nome do arquivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#252525] border-[#333333] text-white"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "video" | "photo")}
              className="px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-white text-sm"
            >
              <option value="all">Todos os tipos</option>
              <option value="video">Vídeos</option>
              <option value="photo">Fotos</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#252525] border border-[#333333] rounded-md text-white text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "Todas as categorias" : cat}
                </option>
              ))}
            </select>

            {/* Toggle view mode */}
            <div className="flex border border-[#333333] rounded-md overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`${viewMode === "grid" ? "bg-[#d87093]" : ""} rounded-none`}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`${viewMode === "list" ? "bg-[#d87093]" : ""} rounded-none`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#333333] text-sm text-gray-400">
          <span>{filteredFiles.length} arquivo(s) encontrado(s)</span>
          <span>{files.filter(f => f.file_type === 'video').length} vídeos</span>
          <span>{files.filter(f => f.file_type === 'photo').length} fotos</span>
          <span>
            {formatFileSize(files.reduce((acc, f) => acc + f.file_size, 0))} total
          </span>
        </div>
      </div>

      {/* Lista de arquivos */}
      <div className="bg-[#1e1e1e] rounded-lg border border-[#333333]">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileVideo className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum arquivo encontrado</p>
            <p className="text-sm">Faça upload de alguns arquivos ou ajuste os filtros</p>
          </div>
        ) : (
          <div className={`p-6 ${viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
            : "space-y-4"
          }`}>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`bg-[#252525] rounded-lg overflow-hidden border border-[#333333] hover:border-[#d87093] transition-colors ${
                  viewMode === "list" ? "flex items-center gap-4 p-4" : ""
                }`}
              >
                {viewMode === "grid" ? (
                  // Grid view
                  <>
                    <div className="relative aspect-video bg-black">
                      {file.file_type === 'video' ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white opacity-70" />
                          {file.thumbnail_url && (
                            <img
                              src={file.thumbnail_url}
                              alt={file.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <img
                          src={file.file_url}
                          alt={file.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start gap-2 mb-2">
                        {file.file_type === 'video' ? (
                          <FileVideo className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <FileImage className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        )}
                        <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight">
                          {file.title}
                        </h3>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-400">
                        <p>{formatFileSize(file.file_size)}</p>
                        <p>{file.category}</p>
                        <p>{formatDate(file.created_at)}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          className="h-8 px-2"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file.id)}
                          className="h-8 px-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  // List view
                  <>
                    <div className="w-16 h-12 bg-black rounded flex-shrink-0 flex items-center justify-center">
                      {file.file_type === 'video' ? (
                        <FileVideo className="w-6 h-6 text-blue-400" />
                      ) : (
                        <FileImage className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <h3 className="text-white font-medium truncate">{file.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>{file.file_name}</span>
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{file.category}</span>
                        <span>{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}