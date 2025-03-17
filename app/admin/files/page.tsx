"use client"

import { AdminLayout } from "@/components/admin/layout"
import { BlobManager } from "@/components/admin/blob-manager"

export default function FilesPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Arquivos</h1>
        <BlobManager />
      </div>
    </AdminLayout>
  )
}

