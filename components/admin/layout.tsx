"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Upload, 
  FolderOpen, 
  Settings,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Upload', href: '/admin/upload', icon: Upload },
    { name: 'Gerenciar', href: '/admin/files', icon: FolderOpen },
    { name: 'Configurações', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-[#1e1e1e] rounded-lg"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed inset-y-0 left-0 z-40 w-64 bg-[#1e1e1e] border-r border-[#333333] transition-transform duration-300`}>
        <div className="flex items-center h-16 px-6 border-b border-[#333333]">
          <h1 className="text-xl font-bold text-[#d87093]">Admin Panel</h1>
        </div>
        
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#d87093] text-white' 
                    : 'text-gray-400 hover:bg-[#252525] hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}