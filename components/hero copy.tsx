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
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/hero.png" alt="Rapha Nakai" fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div
          className={`max-w-3xl mx-auto text-center transition-all duration-1000 transform ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >

          <h1 className="font-serif italic text-6xl md:text-8xl tracking-wide mb-6 opacity-90">
            <span className="block md:inline-block">Rapha</span>
            <span className="block md:inline-block md:ml-4">Nakai</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-xl mx-auto leading-relaxed">
            Criatividade e elegância em cada projeto
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-[fadeIn_1.6s_ease-in-out]">
            <Button
              onClick={() => scrollToSection("projetos")}
              className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-8 py-6 text-lg transition-transform hover:scale-105"
            >
              Ver Projetos
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-pointer transition-opacity duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => scrollToSection("sobre")}
      >
        <span className="text-sm uppercase tracking-widest mb-2">Scroll</span>
        <ChevronDown className="w-6 h-6 animate-bounce" />
      </div>
    </section>
  )
}
