"use client"

import { AdminLayout } from "@/components/admin/layout"
import { IOSUploader } from "@/components/upload/ios-uploader"

export default function UploadPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <IOSUploader />
      </div>
    </AdminLayout>
  )
}