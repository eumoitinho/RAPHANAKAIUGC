"use client"

import { AdminLayout } from "@/components/admin/layout"
import { MediaUploader } from "@/components/admin/media-uploader"

export default function UploadPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <MediaUploader />
      </div>
    </AdminLayout>
  )
}