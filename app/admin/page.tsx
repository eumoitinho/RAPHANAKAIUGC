"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/layout"
import { SupabaseMediaUploader } from "@/components/admin/supabase-media-uploader"
import { SupabaseMediaManager } from "@/components/admin/supabase-media-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FolderOpen } from "lucide-react"

export default function FilesPage() {
  const [refreshManager, setRefreshManager] = useState(0)

  const handleUploadComplete = () => {
    setRefreshManager(prev => prev + 1)
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Arquivos</h1>
        
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
              <h2 className="text-xl font-medium mb-4">Upload de Mídia</h2>
              <SupabaseMediaUploader onUploadComplete={handleUploadComplete} />
            </div>
          </TabsContent>

          <TabsContent value="manager" className="mt-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4">Gerenciar Mídia</h2>
              <SupabaseMediaManager key={refreshManager} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
