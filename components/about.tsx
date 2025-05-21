"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Camera, Film, Palette, Mic, Video } from "lucide-react"

export function About() {
  const [activeTab, setActiveTab] = useState("conteudos")
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

    const element = document.getElementById("sobre")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  const contentTypes = [
    { name: "Unboxing", icon: <Camera size={18} /> },
    { name: "Lifestyle (estilo vlog)", icon: <Film size={18} /> },
    { name: "ASMR (sensorial)", icon: <Mic size={18} /> },
    { name: "Demonstração do produto", icon: <Video size={18} /> },
    { name: "GRWM (arrume-se comigo)", icon: <Palette size={18} /> },
    { name: "Serviços (ida ao local para captação dos vídeos)", icon: <Camera size={18} /> },
    { name: "Aesthetic", icon: <Film size={18} /> },
  ]

  const skills = [
    "Direção criativa",
    "Edição de vídeo",
    "Fotografia",
    "Storytelling",
    "Produção audiovisual",
    "Social media",
    "Branding visual",
  ]

  return (
    <section id="sobre" className="py-24 bg-[#1e1e1e]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Image with decorative elements */}
          <div
            className={`relative order-2 md:order-1 transition-all duration-1000 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="relative aspect-[3/4] max-w-md mx-auto md:ml-0">
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-[#d87093]/10 -z-10 animate-pulse"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-[#d87093]/30 rounded-full -z-10 animate-pulse"></div>

              <div className="relative h-full w-full overflow-hidden rounded-lg">
                <Image src="/images/aboutphoto.jpg" alt="Rapha Nakai" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              </div>

              {/* Experience badge */}
              <div className="absolute -bottom-5 -right-5 bg-[#1e1e1e] shadow-lg rounded-lg p-4 flex items-center animate-[fadeIn_1s_ease-in-out]">
                <div className="bg-[#d87093] text-white rounded-full w-12 h-12 flex items-center justify-center mr-3">
                  <span className="text-xl font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Anos de</p>
                  <p className="font-medium text-white">Experiência</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className={`order-1 md:order-2 transition-all duration-1000 delay-300 transform ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-sm uppercase tracking-wider text-[#d87093] font-medium mb-2">Sobre Mim</h2>
            <h3 className="text-3xl md:text-4xl text-[#fff5dc] font-bold mb-6">
              CONHEÇA A MENTE CRIATIVA
              <br />
              POR TRÁS DAS CÂMERAS
            </h3>

            <div className="space-y-4 text-gray-300">
              <p className="animate-[fadeIn_0.6s_ease-in-out]">
                Tenho 23 anos e, desde os 15, muito tempo antes de conhecer o termo
                <span className="text-white font-medium"> UGC Creator</span>, eu já tinha uma paixão em gravar e editar
                vídeos e fotos como hobbie.
              </p>

              <p className="animate-[fadeIn_0.8s_ease-in-out]">
                Sempre tive conexão com o audiovisual, a influência vem de família, parentes que atuam na indústria do
                cinema e audiovisual sempre foram inspiração para quem eu queria me tornar.
              </p>

              <p className="animate-[fadeIn_1s_ease-in-out]">
                Direção criativa, captações e a magia de contar histórias através das lentes sempre foram minhas maiores
                paixões. Na criação de conteúdo, encontrei o equilíbrio perfeito entre idealizar e executar minhas
                ideias exatamente como imaginei.
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-8 animate-[fadeIn_1.2s_ease-in-out]">
              <div className="border-b border-gray-800">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab("conteudos")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "conteudos"
                        ? "border-[#d87093] text-[#d87093]"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Conteúdos
                  </button>
                  <button
                    onClick={() => setActiveTab("habilidades")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === "habilidades"
                        ? "border-[#d87093] text-[#d87093]"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Habilidades
                  </button>
                </div>
              </div>

              <div className="mt-6">
                {activeTab === "conteudos" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {contentTypes.map((content, index) => (
                      <div
                        key={index}
                        className="flex items-start transition-all duration-300 hover:translate-x-1"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="w-8 h-8 bg-[#252525] rounded-lg flex items-center justify-center text-[#d87093] mr-3">
                          {content.icon}
                        </div>
                        <div>
                          <p className="text-white">{content.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center transition-all duration-300 hover:translate-x-1"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="w-2 h-2 bg-[#d87093] rounded-full mr-3"></div>
                        <p className="text-white">{skill}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
