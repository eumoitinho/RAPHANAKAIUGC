"use client"

import { useEffect, useState } from "react"
import { Camera, Palette, Video, Users, PenTool, Lightbulb } from "lucide-react"

const services = [
  {
    icon: <Camera className="h-6 w-6" />,
    title: "Fotografia Editorial",
    description:
      "Criação de imagens para editoriais de moda, beleza e lifestyle com foco em contar histórias visuais impactantes.",
  },
  {
    icon: <Palette className="h-6 w-6" />,
    title: "Direção de Arte",
    description:
      "Desenvolvimento de conceitos visuais e direção artística para projetos de moda, publicidade e conteúdo digital.",
  },
  {
    icon: <Video className="h-6 w-6" />,
    title: "Produção Visual",
    description: "Produção completa de conteúdo visual para marcas, incluindo fotografia, styling e pós-produção.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Campanhas Publicitárias",
    description:
      "Criação e execução de campanhas visuais para marcas, com foco em comunicar valores e mensagens de forma autêntica.",
  },
  {
    icon: <PenTool className="h-6 w-6" />,
    title: "Identidade Visual",
    description:
      "Desenvolvimento de identidade visual para marcas e projetos, incluindo logotipos, paletas de cores e diretrizes.",
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: "Consultoria Criativa",
    description:
      "Consultoria para marcas e profissionais que buscam aprimorar sua comunicação visual e presença de marca.",
  },
]

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

    const element = document.getElementById("services-section")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  return (
    <section id="services" className="py-20 bg-[#f8f5f0]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm uppercase tracking-wider text-[#c17a54] font-medium mb-2">Meus Serviços</h2>
          <h3 className="text-4xl font-bold mb-6">O que eu ofereço</h3>
          <p className="text-gray-600">
            Ofereço uma gama completa de serviços criativos para ajudar marcas e profissionais a comunicarem sua
            mensagem através de imagens impactantes e narrativas visuais autênticas.
          </p>
        </div>

        <div id="services-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className={`bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-[#ffd9c7] rounded-lg flex items-center justify-center text-[#c17a54] mb-6">
                {service.icon}
              </div>
              <h4 className="text-xl font-bold mb-3">{service.title}</h4>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
