"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Home, Film, ImageIcon, Settings, LogOut, Menu, X, ChevronDown, FolderOpen } from "lucide-react"

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

  const toggleSubmenu = (menu: string) => {
    if (openSubmenu === menu) {
      setOpenSubmenu(null)
    } else {
      setOpenSubmenu(menu)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Mobile Header */}
      <header className="md:hidden bg-black p-4 flex items-center justify-between">
        <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} className="text-white">
          {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-xl font-serif italic">Admin Dashboard</h1>
        <div className="w-6"></div> {/* Spacer for alignment */}
      </header>

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-black w-64 transition-all duration-300 z-40
        ${isSidebarOpen ? "md:w-64" : "md:w-20"} 
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <Link href="/" className={`font-serif italic text-xl ${!isSidebarOpen && "md:hidden"}`}>
              Rapha Nakai
            </Link>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:block text-gray-400 hover:text-white"
            >
              {isSidebarOpen ? (
                <ChevronDown className="rotate-90" size={20} />
              ) : (
                <ChevronDown className="-rotate-90" size={20} />
              )}
            </button>
          </div>

          {/* Sidebar Menu */}
          <nav className="flex-1 py-4 overflow-y-auto">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#1e1e1e] hover:text-white"
                >
                  <Home size={20} className="min-w-[20px]" />
                  <span className={`ml-3 ${!isSidebarOpen && "md:hidden"}`}>Dashboard</span>
                </Link>
              </li>

              <li>
                <button
                  onClick={() => toggleSubmenu("media")}
                  className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-[#1e1e1e] hover:text-white"
                >
                  <div className="flex items-center">
                    <Film size={20} className="min-w-[20px]" />
                    <span className={`ml-3 ${!isSidebarOpen && "md:hidden"}`}>Vídeos</span>
                  </div>
                  {isSidebarOpen && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${openSubmenu === "media" ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {openSubmenu === "media" && isSidebarOpen && (
                  <ul className="mt-1 pl-10 space-y-1">
                    <li>
                      <Link href="/admin" className="block py-2 text-gray-400 hover:text-white">
                        Upload
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin" className="block py-2 text-gray-400 hover:text-white">
                        Gerenciar
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <button
                  onClick={() => toggleSubmenu("photos")}
                  className="w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-[#1e1e1e] hover:text-white"
                >
                  <div className="flex items-center">
                    <ImageIcon size={20} className="min-w-[20px]" />
                    <span className={`ml-3 ${!isSidebarOpen && "md:hidden"}`}>Fotos</span>
                  </div>
                  {isSidebarOpen && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${openSubmenu === "photos" ? "rotate-180" : ""}`}
                    />
                  )}
                </button>

                {openSubmenu === "photos" && isSidebarOpen && (
                  <ul className="mt-1 pl-10 space-y-1">
                    <li>
                      <Link href="/admin" className="block py-2 text-gray-400 hover:text-white">
                        Upload
                      </Link>
                    </li>
                    <li>
                      <Link href="/admin" className="block py-2 text-gray-400 hover:text-white">
                        Gerenciar
                      </Link>
                    </li>
                  </ul>
                )}
              </li>

              <li>
                <Link
                  href="/admin/files"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#1e1e1e] hover:text-white"
                >
                  <FolderOpen size={20} className="min-w-[20px]" />
                  <span className={`ml-3 ${!isSidebarOpen && "md:hidden"}`}>Arquivos</span>
                </Link>
              </li>

              <li>
                <Link
                  href="/admin/settings"
                  className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#1e1e1e] hover:text-white"
                >
                  <Settings size={20} className="min-w-[20px]" />
                  <span className={`ml-3 ${!isSidebarOpen && "md:hidden"}`}>Configurações</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-800">
            <button className="flex items-center text-gray-300 hover:text-white w-full">
              <LogOut size={20} className="min-w-[20px]" />
              <span className={`ml-3 ${!isSidebarOpen && "md:hidden"}`}>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        } ${isMobileSidebarOpen ? "blur-sm" : ""} md:blur-none`}
      >
        <div className="min-h-screen pt-0 md:pt-4">{children}</div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}

