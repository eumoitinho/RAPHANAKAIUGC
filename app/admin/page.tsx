"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/admin/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <p className="text-gray-400">Redirecionando para o dashboard...</p>
    </div>
  )
}

