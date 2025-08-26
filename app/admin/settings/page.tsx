"use client"

import { AdminLayout } from "@/components/admin/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Settings,
  Database,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [storageUsed] = useState(0)
  const [totalStorage] = useState(50) // 50GB

  const storagePercentage = (storageUsed / totalStorage) * 100

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-gray-400">
            Gerencie as configurações do sistema de upload
          </p>
        </div>

        <div className="space-y-6">
          {/* Configurações de Upload */}
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#d87093]" />
                Configurações de Upload
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configurações para uploads de arquivos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max-file-size" className="text-gray-400">
                    Tamanho máximo (MB)
                  </Label>
                  <Input
                    id="max-file-size"
                    value="5120"
                    disabled
                    className="bg-[#252525] border-[#333333] text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Plano Pro: até 5GB por arquivo
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="chunk-size" className="text-gray-400">
                    Tamanho do chunk (MB)
                  </Label>
                  <Input
                    id="chunk-size"
                    value="6"
                    disabled
                    className="bg-[#252525] border-[#333333] text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Otimizado para iOS
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-400">Formatos suportados</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['MOV', 'MP4', 'HEVC', 'HEIC', 'JPG', 'PNG', 'WEBP', 'GIF'].map(format => (
                    <div key={format} className="flex items-center gap-2 p-2 bg-[#252525] rounded">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      <span className="text-white text-sm">{format}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Armazenamento */}
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#d87093]" />
                Armazenamento
              </CardTitle>
              <CardDescription className="text-gray-400">
                Status do seu armazenamento no Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Usado</span>
                  <span className="text-white">{storageUsed} GB de {totalStorage} GB</span>
                </div>
                <div className="w-full bg-[#333333] rounded-full h-2">
                  <div 
                    className="bg-[#d87093] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {(100 - storagePercentage).toFixed(1)}% disponível
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-[#252525] rounded-lg">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-gray-400">Vídeos</p>
                </div>
                <div className="text-center p-3 bg-[#252525] rounded-lg">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-xs text-gray-400">Fotos</p>
                </div>
                <div className="text-center p-3 bg-[#252525] rounded-lg">
                  <p className="text-2xl font-bold text-white">0 GB</p>
                  <p className="text-xs text-gray-400">Thumbnails</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Sistema */}
          <Card className="bg-[#1e1e1e] border-[#333333]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#d87093]" />
                Sistema
              </CardTitle>
              <CardDescription className="text-gray-400">
                Informações e configurações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Versão do Sistema</Label>
                  <p className="text-white font-mono">1.0.0</p>
                </div>
                <div>
                  <Label className="text-gray-400">Ambiente</Label>
                  <p className="text-white">Desenvolvimento</p>
                </div>
                <div>
                  <Label className="text-gray-400">Protocolo de Upload</Label>
                  <p className="text-white">TUS (Resumable Uploads)</p>
                </div>
                <div>
                  <Label className="text-gray-400">Provider</Label>
                  <p className="text-white">Supabase Storage</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333333]">
                <h3 className="text-white font-medium mb-3">Status dos Serviços</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Supabase Storage</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">TUS Upload Endpoint</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Banco de Dados</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-400 text-sm">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zona de Perigo */}
          <Card className="bg-[#1e1e1e] border-red-900">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Zona de Perigo
              </CardTitle>
              <CardDescription className="text-gray-400">
                Ações irreversíveis do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Limpar Cache de Upload</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Remove todos os uploads temporários e sessões em andamento.
                </p>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Cache
                </Button>
              </div>

              <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Reset Completo</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Remove todos os arquivos e dados. Esta ação não pode ser desfeita.
                </p>
                <Button variant="destructive" size="sm" disabled>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Reset Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}