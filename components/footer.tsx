"use client"

import { useState, useEffect } from "react"
import { Instagram, Facebook, Youtube, ArrowUp } from "lucide-react"

export function Footer() {
  const [isVisible, setIsVisible] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("footer")
    if (element) observer.observe(element)

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (element) observer.unobserve(element)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer id="footer" className="bg-[#0f0f0f] pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* About */}
          <div>
            <h3 className="text-xl font-serif italic mb-4">Rapha Nakai</h3>
            <p className="text-white/70 mb-6">
              Criação de conteúdo visual autêntico e impactante para conectar marcas com seu público.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com/raphanakai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#252525] flex items-center justify-center text-white hover:bg-[#d87093] transition-colors"
              >
                <Instagram size={18} />
              </a>
              
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-medium mb-4">Links Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection("sobre")}
                  className="text-white/70 hover:text-[#d87093] transition-colors"
                >
                  Sobre
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("projetos")}
                  className="text-white/70 hover:text-[#d87093] transition-colors"
                >
                  Projetos
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("servicos")}
                  className="text-white/70 hover:text-[#d87093] transition-colors"
                >
                  Serviços
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contato")}
                  className="text-white/70 hover:text-[#d87093] transition-colors"
                >
                  Contato
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-medium mb-4">Serviços</h3>
            <ul className="space-y-3">
              <li className="text-white/70">Fotografia</li>
              <li className="text-white/70">Conteúdo para Redes</li>
              <li className="text-white/70">Vídeos Promocionais</li>
              <li className="text-white/70">Direção Criativa</li>
              <li className="text-white/70">UGC (Conteúdo Gerado pelo Usuário)</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-medium mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="text-white/70">Ilhabela, SP - Brasil</li>
              <li className="text-white/70">(18) 98105-0201</li>
              <li className="text-white/70">raphanakai@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#252525] pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm">© {currentYear} Rapha Nakai. Todos os direitos reservados.</p>
          <div className="mt-4 md:mt-0">
            <button
              onClick={scrollToTop}
              className={`w-10 h-10 rounded-full bg-[#d87093] flex items-center justify-center text-white transition-all duration-300 hover:bg-[#c45c7c] fixed bottom-6 right-6 z-30 ${
                showScrollTop ? "opacity-100 visible" : "opacity-0 invisible"
              }`}
            >
              <ArrowUp size={20} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
