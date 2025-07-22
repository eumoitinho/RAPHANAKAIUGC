"use client"

import { useState, useEffect } from "react"
import { Camera, Film, Video, Palette, Users, Sparkles } from "lucide-react"

export function Services() {
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

    const element = document.getElementById("servicos")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  const services = [
    {
      icon: <Camera className="h-10 w-10" />,
      title: "Fotografia",
      description: "Captação de imagens em alta qualidade para sua marca, produtos ou serviços.",
    },
    {
      icon: <Film className="h-10 w-10" />,
      title: "Conteúdo para Redes",
      description: "Criação de conteúdo autêntico e engajante para suas plataformas sociais.",
    },
    {
      icon: <Video className="h-10 w-10" />,
      title: "Vídeos Promocionais",
      description: "Produção de vídeos focados em ADS para impulsionar em tráfego pago.",
    },
    {
      icon: <Palette className="h-10 w-10" />,
      title: "Direção Criativa",
      description: "Desenvolvimento de conceitos visuais e narrativas para sua marca.",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "UGC (Conteúdo Gerado pelo Usuário)",
      description: "Criação de conteúdo autêntico que se conecta com seu público.",
    },
    {
      icon: <Sparkles className="h-10 w-10" />,
      title: "Edição Profissional",
      description: "Edição de fotos e vídeos com acabamento profissional e estética única.",
    },
  ]

  return (
    <section id="servicos" className="py-24 bg-[#1e1e1e]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#d87093] uppercase tracking-wider text-sm font-medium">Serviços</span>
          <h2 className="text-4xl md:text-5xl font-serif italic mt-2 mb-6">O que eu ofereço</h2>
          <p className="text-white/80 text-lg">
            Conteúdos visuais que dizem o que sua marca quer comunicar e o seu público precisa sentir
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className={`bg-[#252525] rounded-lg p-6 transition-all duration-500 hover:bg-[#2a2a2a] hover:shadow-lg hover:translate-y-[-4px] transform ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 bg-[#d87093]/10 rounded-full flex items-center justify-center mb-6 text-[#d87093] animate-[pulse_3s_ease-in-out_infinite]">
                {service.icon}
              </div>
              <h3 className="text-xl font-medium mb-3">{service.title}</h3>
              <p className="text-white/70">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
