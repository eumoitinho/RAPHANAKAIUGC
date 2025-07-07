"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Instagram, Facebook, Youtube } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)

      // Find the active section based on scroll position
      const sections = ["home", "sobre", "projetos", "servicos", "contato"]
      for (const section of sections.reverse()) {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    setIsOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-black/80 backdrop-blur-md py-3 shadow-md" : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="font-serif italic text-2xl text-white hover:text-[#d87093] transition-colors"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
            >
              Rapha Nakai
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <ul className="flex space-x-6">
                <li>
                  <button
                    onClick={() => scrollToSection("sobre")}
                    className={`text-sm uppercase tracking-wider hover:text-[#d87093] transition-colors ${
                      activeSection === "sobre" ? "text-[#d87093]" : "text-white"
                    }`}
                  >
                    Sobre
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("projetos")}
                    className={`text-sm uppercase tracking-wider hover:text-[#d87093] transition-colors ${
                      activeSection === "projetos" ? "text-[#d87093]" : "text-white"
                    }`}
                  >
                    Projetos
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("servicos")}
                    className={`text-sm uppercase tracking-wider hover:text-[#d87093] transition-colors ${
                      activeSection === "servicos" ? "text-[#d87093]" : "text-white"
                    }`}
                  >
                    Serviços
                  </button>
                </li>
                
              </ul>

              <Button
                onClick={() => scrollToSection("contato")}
                className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-6 transition-transform hover:scale-105"
              >
                Contato
              </Button>
            </nav>

            {/* Social Icons - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="https://instagram.com/raphanakai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-[#d87093] transition-colors"
              >
                <Instagram size={20} />
              </a>
              
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white hover:text-[#d87093] transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-md transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:hidden flex flex-col justify-center items-center`}
      >
        <nav className="flex flex-col items-center space-y-8">
          <ul className="flex flex-col space-y-6 items-center">
            <li>
              <button
                onClick={() => scrollToSection("sobre")}
                className="text-xl uppercase tracking-wider text-white hover:text-[#d87093] transition-colors"
              >
                Sobre
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("projetos")}
                className="text-xl uppercase tracking-wider text-white hover:text-[#d87093] transition-colors"
              >
                Projetos
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("servicos")}
                className="text-xl uppercase tracking-wider text-white hover:text-[#d87093] transition-colors"
              >
                Serviços
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("contato")}
                className="text-xl uppercase tracking-wider text-white hover:text-[#d87093] transition-colors"
              >
                Contato
              </button>
            </li>
          </ul>

          <Button
            onClick={() => scrollToSection("contato")}
            className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-8 py-6 text-lg animate-pulse"
          >
            Agendar
          </Button>

          {/* Social Icons - Mobile */}
          <div className="flex items-center space-x-6 mt-8">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#d87093] transition-colors"
            >
              <Instagram size={24} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#d87093] transition-colors"
            >
              <Facebook size={24} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-[#d87093] transition-colors"
            >
              <Youtube size={24} />
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}
