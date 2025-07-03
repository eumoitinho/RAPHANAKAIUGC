"use client"

import { AdminLayout } from "@/components/admin/layout"
import { MediaManagerVPS } from "@/components/admin/media-manager-vps"

export default function FilesVPSPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Arquivos VPS</h1>
        <p className="text-gray-400 mb-6">
          Gerencie arquivos armazenados na sua VPS com MongoDB
        </p>
        <MediaManagerVPS />
      </div>
    </AdminLayout>
  )
}

