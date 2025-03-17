"use client"

import { useRef, useEffect } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function BrandVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8
    }
  }, [])

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} autoPlay loop muted playsInline className="object-cover w-full h-full">
          <source src="/video.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Gradient Accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#d87093]/20 via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto h-full flex items-center px-4 md:px-6">
        <div className="max-w-2xl">
          <div className="space-y-6">
            <div>
              <h2 className="text-sm uppercase tracking-wider text-[#d87093] font-medium mb-2">Criação de Conteúdo</h2>
              <h3 className="text-4xl text-[#fff5dc] md:text-5xl font-bold mb-4 leading-tight">
                CONTEÚDO AUTÊNTICO
                <br />
                CRIADO PARA MARCAS
                <br />
                QUE VALORIZAM
              </h3>
              <p className="text-2xl md:text-4xl font-serif italic text-[#d87093]">conexões reais.</p>
            </div>

            <p className="text-gray-300 max-w-lg">
              Criação de conteúdo visual que conecta marcas com seu público de forma autêntica e impactante,
              criando experiências memoráveis.
            </p>

            <div className="pt-4">
              <a href="#projetos" className="text-[#d87093] hover:underline">
                <Button className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-6">
                  Ver Projetos <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-12 right-12 w-32 h-32 border-2 border-[#d87093]/30 rounded-full opacity-50 hidden md:block"></div>
      <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-[#d87093]/10 rounded-full blur-xl hidden md:block"></div>
    </section>
  )
}

