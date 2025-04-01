"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, ImageIcon, Film, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaUploader } from "@/components/admin/media-uploader"
import { MediaManager } from "@/components/admin/media-manager"
import { DebugPanel } from "@/components/admin/debug-panel"

export default function AdminDashboard() {
  const [mediaStats, setMediaStats] = useState({
    totalMedia: 0,
    totalVideos: 0,
    totalPhotos: 0,
    totalViews: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/debug")
        if (response.ok) {
          const data = await response.json()
          setMediaStats({
            totalMedia: data.metadata.count,
            totalVideos: data.metadata.videos,
            totalPhotos: data.metadata.photos,
            totalViews: data.metadata.views,
          })
        } else {
          console.error("Failed to fetch stats:", await response.text())
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [])

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Média</CardTitle>
              <BarChart className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats.totalMedia}</div>
              <p className="text-xs text-gray-400 mt-1">Itens no portfólio</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Vídeos</CardTitle>
              <Film className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats.totalVideos}</div>
              <p className="text-xs text-gray-400 mt-1">Vídeos publicados</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Fotos</CardTitle>
              <ImageIcon className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mediaStats.totalPhotos}</div>
              <p className="text-xs text-gray-400 mt-1">Fotos publicadas</p>
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
        </div>

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="bg-[#1e1e1e]">
            <TabsTrigger value="upload">Upload de Mídia</TabsTrigger>
            <TabsTrigger value="manage">Gerenciar Arquivos</TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <MediaUploader />
          </TabsContent>

          <TabsContent value="manage">
            <MediaManager />
          </TabsContent>
        </Tabs>

        <DebugPanel />
      </div>
    </AdminLayout>
  )
}

