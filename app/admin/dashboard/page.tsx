"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, ImageIcon, Film, Users, Server, Database } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaUploaderVPS } from "@/components/admin/media-uploader-vps"
import { MediaManagerVPS } from "@/components/admin/media-manager-vps"

export default function AdminDashboardVPS() {
  const [mediaStats, setMediaStats] = useState({
    totalMedia: 0,
    totalVideos: 0,
    totalPhotos: 0,
    totalViews: 0,
    totalSize: 0,
  })

  const [connectionStatus, setConnectionStatus] = useState({
    mongodb: false,
    vps: false,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/upload-media-vps")
        if (response.ok) {
          const data = await response.json()
          const items = data.items || []
          
          const stats = {
            totalMedia: items.length,
            totalVideos: items.filter((item: any) => item.fileType === 'video').length,
            totalPhotos: items.filter((item: any) => item.fileType === 'photo').length,
            totalViews: items.reduce((sum: number, item: any) => sum + (item.views || 0), 0),
            totalSize: items.reduce((sum: number, item: any) => sum + (item.fileSize || 0), 0),
          }
          
          setMediaStats(stats)
          setConnectionStatus({ mongodb: true, vps: true })
        } else {
          console.error("Falha ao buscar estatísticas:", await response.text())
          setConnectionStatus({ mongodb: false, vps: false })
        }
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
        setConnectionStatus({ mongodb: false, vps: false })
      }
    }

    fetchStats()
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard VPS</h1>
            <p className="text-gray-400">Sistema de mídia com MongoDB e VPS própria</p>
          </div>
          
          <div className="flex space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
              connectionStatus.mongodb ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              <Database size={14} />
              <span>MongoDB {connectionStatus.mongodb ? 'Conectado' : 'Desconectado'}</span>
            </div>
            
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
              connectionStatus.vps ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              <Server size={14} />
              <span>VPS {connectionStatus.vps ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Mídia</CardTitle>
              <BarChart className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats.totalMedia}</div>
              <p className="text-xs text-gray-400 mt-1">Arquivos na VPS</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Vídeos</CardTitle>
              <Film className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats.totalVideos}</div>
              <p className="text-xs text-gray-400 mt-1">Vídeos armazenados</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Fotos</CardTitle>
              <ImageIcon className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats.totalPhotos}</div>
              <p className="text-xs text-gray-400 mt-1">Fotos armazenadas</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Visualizações</CardTitle>
              <Users className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats.totalViews}</div>
              <p className="text-xs text-gray-400 mt-1">Total de visualizações</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Armazenamento</CardTitle>
              <Server className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(mediaStats.totalSize)}</div>
              <p className="text-xs text-gray-400 mt-1">Espaço utilizado</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-[#1e1e1e]">
            <TabsTrigger value="upload">Upload VPS</TabsTrigger>
            <TabsTrigger value="manage">Gerenciar Arquivos</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <MediaUploaderVPS />
          </TabsContent>

          <TabsContent value="manage">
            <MediaManagerVPS />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

