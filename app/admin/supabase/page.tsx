"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/layout"
import { SupabaseMediaUploader } from "@/components/admin/supabase-media-uploader"
import { SupabaseMediaManager } from "@/components/admin/supabase-media-manager"
import { IPhoneUploader } from "@/components/admin/iphone-uploader"
import { DirectSupabaseUploader } from "@/components/admin/direct-supabase-uploader"
import { RestApiSupabaseUploader } from "@/components/admin/rest-api-supabase-uploader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FolderOpen, Cloud } from "lucide-react"

export default function SupabaseFilesPage() {
  const [refreshManager, setRefreshManager] = useState(0)

  const handleUploadComplete = () => {
    // Força atualização do manager
    setRefreshManager(prev => prev + 1)
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-6 h-6 text-[#d87093]" />
            <h1 className="text-2xl font-bold">Supabase Storage</h1>
          </div>
          <p className="text-gray-400">
            Gerencie seus arquivos de mídia diretamente no Supabase Storage
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="bg-[#252525]">
            <TabsTrigger value="upload" className="data-[state=active]:bg-[#d87093]">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="manager" className="data-[state=active]:bg-[#d87093]">
              <FolderOpen className="w-4 h-4 mr-2" />
              Gerenciar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Upload de Mídia para Supabase</h2>
              
              {/* NOVO SISTEMA REST API - COMPATÍVEL COM iPHONE */}
              <div className="mb-6">
                <RestApiSupabaseUploader onUploadComplete={handleUploadComplete} />
              </div>
              
              {/* UPLOAD DIRETO - FUNCIONA EM PRODUÇÃO E MOBILE SEM ERRO 413 */}
              <div className="mb-6">
                <DirectSupabaseUploader onUploadComplete={handleUploadComplete} />
              </div>
              
              {/* Upload em chunks para arquivos muito grandes */}
              <div className="mb-6">
                <IPhoneUploader onUploadComplete={handleUploadComplete} />
              </div>
              
              {/* Upload padrão (pode dar erro 413 em produção) */}
              <details className="mb-6">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                  Upload padrão (pode dar erro 413 em produção/mobile)
                </summary>
                <div className="mt-4">
                  <SupabaseMediaUploader onUploadComplete={handleUploadComplete} />
                </div>
              </details>
            </div>
          </TabsContent>

          <TabsContent value="manager" className="mt-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Gerenciar Mídia do Supabase</h2>
              <SupabaseMediaManager key={refreshManager} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}