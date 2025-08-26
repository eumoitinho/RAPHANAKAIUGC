"use client"

import { AdminLayout } from "@/components/admin/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Upload, 
  FolderOpen, 
  Video, 
  Image,
  HardDrive,
  Clock,
  TrendingUp
} from "lucide-react"

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Gerencie seus uploads e arquivos de mídia
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Vídeos</CardTitle>
              <Video className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-500">+0% do mês passado</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total de Fotos</CardTitle>
              <Image className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-500">+0% do mês passado</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Armazenamento</CardTitle>
              <HardDrive className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0 GB</div>
              <p className="text-xs text-gray-500">de 50GB disponível</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Uploads Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#d87093]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-500">+0% de ontem</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#d87093]" />
                Upload Rápido
              </CardTitle>
              <CardDescription className="text-gray-400">
                Envie seus arquivos diretamente do iOS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-[#252525] rounded-lg">
                  <Video className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Vídeos MOV/HEVC</p>
                    <p className="text-gray-400 text-sm">Até 50GB com thumbnail</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-[#252525] rounded-lg">
                  <Image className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Fotos HEIC/JPG</p>
                    <p className="text-gray-400 text-sm">Qualquer tamanho</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#d87093]" />
                Arquivos Recentes
              </CardTitle>
              <CardDescription className="text-gray-400">
                Seus uploads mais recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum arquivo ainda</p>
                  <p className="text-xs">Faça seu primeiro upload</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="mt-8">
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white">Status do Sistema</CardTitle>
              <CardDescription className="text-gray-400">
                Estado atual dos serviços
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Supabase Storage</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Operacional</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Upload TUS</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Operacional</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Geração de Thumbnails</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 text-sm">Operacional</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}