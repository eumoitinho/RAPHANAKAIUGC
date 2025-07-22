"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.jpg"
          alt="Rapha Nakai Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Dark Overlay for Better Text Contrast */}
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div
          className={`max-w-3xl mx-auto text-center transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Nome e Título */}
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 animate-[fadeIn_1s_ease-in-out]">
            Rapha Nakai
          </h1>
          <p className="text-2xl md:text-3xl text-[#d87093] mb-8 animate-[fadeIn_1.2s_ease-in-out]">
            UGC Creator
          </p>

          {/* Slogan or Brief Description */}
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl mx-auto">
            Transformando ideias em experiências visuais.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fadeIn_1.6s_ease-in-out]">
            <Button
              onClick={() => scrollToSection("projects")}
              className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-8 py-6 text-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(216,112,147,0.5)]"
            >
              Ver Projetos
            </Button>
            <Button
              onClick={() => scrollToSection("contact")}
              variant="outline"
              className="border-white text-white hover:bg-white/20 rounded-full px-8 py-6 text-lg transition-all duration-300 hover:scale-105"
            >
              Entre em Contato
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer transition-opacity duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => scrollToSection("featured")}
      >
        <span className="text-sm uppercase tracking-widest mb-2 text-white animate-pulse">Scroll</span>
        <ChevronDown className="w-6 h-6 text-white animate-bounce" />
      </div>
    </section>
  )
}