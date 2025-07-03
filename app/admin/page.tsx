"use client"

import { AdminLayout } from "@/components/admin/layout"
import { MediaManager } from "@/components/admin/media-manager"
import { MediaManagerVPS } from "@/components/admin/media-manager-vps"

export default function FilesPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Arquivos</h1>
        <MediaManagerVPS />
      </div>
    </AdminLayout>
  )
}
