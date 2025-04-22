"use client"

import { AdminLayout } from "@/components/admin/layout"
import { MediaManager } from "@/components/admin/media-manager"

export default function FilesPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Arquivos</h1>
        <MediaManager />
      </div>
    </AdminLayout>
  )
}
