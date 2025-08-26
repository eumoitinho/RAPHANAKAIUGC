"use client"

import { AdminLayout } from "@/components/admin/layout"
import { FileManager } from "@/components/admin/file-manager"

export default function FilesPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Gerenciar Arquivos</h1>
          <p className="text-gray-400">
            Visualize, organize e gerencie todos os seus uploads
          </p>
        </div>
        
        <FileManager />
      </div>
    </AdminLayout>
  )
}