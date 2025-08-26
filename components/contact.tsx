"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Instagram, MessageCircle } from "lucide-react"

export function Contact() {
  const [isVisible, setIsVisible] = useState(false)

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

    const element = document.getElementById("contato")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  const whatsappNumber = "5518981050201"
  const whatsappMessage = "Olá Rapha! Vim pelo seu portfólio e gostaria de conversar sobre um projeto."

  const openWhatsApp = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
    window.open(url, '_blank')
  }

  return (
    <section id="contato" className="py-24 bg-[#121212]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#d87093] uppercase tracking-wider text-sm font-medium">Contato</span>
          <h2 className="text-4xl md:text-5xl font-serif italic mt-2 mb-6">Vamos Trabalhar Juntos</h2>
          <p className="text-white/80 text-lg">
            Entre em contato pelo WhatsApp para discutirmos seu projeto e como posso ajudar a criar conteúdo visual impactante para
            sua marca.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* WhatsApp Call to Action */}
          <div
            className={`transition-all duration-1000 transform ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <div className="bg-[#1a1a1a] rounded-lg p-8 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-medium mb-6">Fale Comigo Agora</h3>
              <p className="text-white/70 mb-8">
                Estou sempre disponível para discutir novos projetos e oportunidades. 
                Clique no botão abaixo para iniciar uma conversa no WhatsApp.
              </p>
              
              <Button
                onClick={openWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20BD5C] text-white group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] h-14 text-lg"
              >
                <MessageCircle className="mr-2 h-6 w-6" />
                Conversar no WhatsApp
              </Button>

              <div className="mt-8 p-4 bg-[#252525] rounded-lg">
                <p className="text-sm text-white/60 text-center">
                  Atendimento rápido e personalizado
                </p>
                <p className="text-xs text-white/40 text-center mt-2">
                  Responderei sua mensagem o mais breve possível
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div
            className={`transition-all duration-1000 transform ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="bg-[#1a1a1a] rounded-lg p-8 h-full">
              <h3 className="text-2xl font-medium mb-6">Informações de Contato</h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#d87093]/10 flex items-center justify-center mr-4 text-[#d87093]">
                    <MapPin />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">Localização</h4>
                    <p className="text-white/70 mt-1">Ilhabela, SP - Brasil</p>
                  </div>
                </div>

                <a 
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start hover:bg-[#252525] p-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center mr-4 text-[#25D366]">
                    <MessageCircle />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">WhatsApp</h4>
                    <p className="text-white/70 mt-1">+55 (18) 98105-0201</p>
                  </div>
                </a>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#d87093]/10 flex items-center justify-center mr-4 text-[#d87093]">
                    <Mail />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">Email</h4>
                    <p className="text-white/70 mt-1">raphanakai@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h4 className="text-lg font-medium mb-4">Redes Sociais</h4>
                <div className="flex space-x-4">
                  <a
                    href="https://instagram.com/raphanakai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                  >
                    <Instagram size={20} />
                  </a>
                  <button
                    onClick={openWhatsApp}
                    className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center text-white hover:bg-[#25D366] transition-all duration-300"
                  >
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}