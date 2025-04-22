"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-md py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif italic tracking-wider">
            Rapha Nakai
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {["sobre", "projetos", "planos", "contato"].map((item) => (
              <Link
                key={item}
                href={`#${item}`}
                className="uppercase tracking-wider text-sm hover:text-[#d87093] transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md">
          <nav className="flex flex-col items-center py-8 space-y-6">
            {["sobre", "projetos", "planos", "contato"].map((item) => (
              <Link
                key={item}
                href={`#${item}`}
                className="uppercase tracking-wider text-sm hover:text-[#d87093] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
