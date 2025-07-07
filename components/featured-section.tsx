"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function FeaturedSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Fix hydration mismatch by only generating random values on client
  const [particles, setParticles] = useState<
    Array<{
      id: number
      width: number
      height: number
      top: number
      left: number
      duration: number
      delay: number
    }>
  >([])

  useEffect(() => {
    setMounted(true)

    // Generate particles only on client side to avoid hydration mismatch
    const generatedParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      width: Math.random() * 6 + 2,
      height: Math.random() * 6 + 2,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }))

    setParticles(generatedParticles)
  }, [])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("featured")
    if (element) observer.observe(element)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      if (element) observer.unobserve(element)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Don't render particles until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <section id="featured" className="relative py-24 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay loop muted playsInline className="object-cover w-full h-full">
            <source src="/video.mov" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-[#d87093]/20 via-transparent to-transparent animate-pulse"></div>
        </div>

        <div className="container relative z-10 mx-auto h-full flex items-center px-4 md:px-6">
          <div className="max-w-2xl">
            <div className="space-y-6 opacity-0">
              <div className="bg-[#d87093]/20 backdrop-blur-sm border border-[#d87093]/30 rounded-full px-4 py-1.5 flex items-center gap-2 w-fit">
                <Sparkles className="h-4 w-4 text-[#d87093] animate-pulse" />
                <span className="text-sm font-medium text-white">Premium Content Creator</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="featured" className="relative py-24 min-h-screen flex items-center overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} autoPlay loop muted playsInline className="object-cover w-full h-full">
          <source src="/video.mov" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Gradient Accent */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#d87093]/20 via-transparent to-transparent animate-pulse"></div>
      </div>

      {/* Animated Particles - Only render after mount */}
      <div className="absolute inset-0 z-[1] opacity-30">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white/30"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              animation: `floatAnimation ${particle.duration}s infinite ease-in-out`,
              animationDelay: `${particle.delay}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Mouse Follow Effect */}
      <div
        className="fixed w-40 h-40 rounded-full bg-[#d87093]/10 blur-3xl pointer-events-none z-[1] opacity-50 hidden md:block"
        style={{
          transform: `translate(${mousePosition.x - 80}px, ${mousePosition.y - 80}px)`,
          transition: "transform 0.3s ease-out",
        }}
      ></div>

      {/* Decorative Elements */}
      <div className="absolute bottom-12 right-12 w-32 h-32 border-2 border-[#d87093]/30 rounded-full opacity-50 animate-[spin_30s_linear_infinite] hidden md:block"></div>
      <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-[#d87093]/10 rounded-full blur-xl animate-pulse hidden md:block"></div>
      <div className="absolute top-1/3 right-1/3 w-24 h-24 border border-white/20 rounded-full opacity-30 animate-[spin_20s_linear_infinite_reverse] hidden md:block"></div>

      {/* Content */}
      <div className="container relative z-10 mx-auto h-full flex items-center px-4 md:px-6">
        <div className="max-w-2xl">
          <div
            className={`space-y-6 transition-all duration-1000 transform ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            {/* Badge */}
            <div className="flex items-center gap-2 animate-[fadeIn_0.4s_ease-in-out]">
              <div className="bg-[#d87093]/20 backdrop-blur-sm border border-[#d87093]/30 rounded-full px-4 py-1.5 flex items-center gap-2 w-fit">
                <Sparkles className="h-4 w-4 text-[#d87093] animate-pulse" />
                <span className="text-sm font-medium text-white">Premium Content Creator</span>
              </div>
            </div>

            <div>
              {/* Heading with decorative elements */}
              <div className="relative">
                <h2 className="text-2xl md:text-4xl font-serif uppercase tracking-wider text-[#d87093] font-medium mb-2 animate-[fadeIn_0.6s_ease-in-out] relative z-10">
                  CRIAÇÃO DE CONTEÚDO
                  <div className="absolute -right-8 -top-6 bg-gradient-to-r from-[#d87093] to-[#ff9eb7] text-white text-xs rounded-full px-2 py-1 flex items-center gap-1 animate-bounce"></div>
                </h2>
              </div>

              {/* Main heading with highlight effects */}
              <div className="relative">
                <h3 className="text-4xl text-[#fff5dc] md:text-5xl font-bold mb-4 leading-tight">
                  <div className="animate-[fadeIn_0.8s_ease-in-out] relative">CONTEÚDO AUTÊNTICO</div>
                  <div className="animate-[fadeIn_1s_ease-in-out] relative">
                    <span className="relative">
                      CRIADO PARA MARCAS
                      <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-[#d87093] to-transparent"></span>
                    </span>
                  </div>
                  <div className="animate-[fadeIn_1.2s_ease-in-out] flex items-center gap-2">QUE VALORIZAM</div>
                </h3>
              </div>

              {/* Stylized text with glow effect */}
              <div className="relative">
                <p className="text-2xl md:text-4xl font-serif italic text-white animate-[fadeIn_1.4s_ease-in-out] relative z-10">
                  CONEXÕES REAIS.
                </p>
              </div>
            </div>

            {/* Description with highlight box */}
            <div className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-[#d87093] to-transparent rounded-full"></div>
              <p className="text-gray-300 max-w-lg animate-[fadeIn_1.6s_ease-in-out] pl-4 backdrop-blur-sm bg-black/20 p-4 rounded-lg border border-white/10">
                Criação de conteúdo visual que conecta marcas com seu público de forma autêntica e impactante, criando
                experiências memoráveis.
              </p>
            </div>

            {/* Button with enhanced effects */}
            <div className="pt-4 animate-[fadeIn_1.8s_ease-in-out]">
              <a href="#projetos" className="text-[#d87093] hover:underline relative group">
                <Button className="bg-[#d87093] hover:bg-[#c45c7c] text-white rounded-full px-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(216,112,147,0.5)] relative overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Ver Projetos <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#d87093] to-[#ff9eb7] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
              </a>
            </div>

            {/* Stats badges */}
            <div className="flex flex-wrap gap-4 animate-[fadeIn_2s_ease-in-out]">
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#d87093] animate-pulse"></div>
                <span className="text-xs font-medium">Lifestyle</span>
              </div>
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#d87093]"></div>
                <span className="text-xs font-medium">ADs</span>
              </div>
              <div className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#d87093]"></div>
                <span className="text-xs font-medium">Conteúdo Exclusivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Decorative Elements */}
      <div className="absolute bottom-12 right-12 w-32 h-32 border-2 border-[#d87093]/30 rounded-full opacity-50 hidden md:block"></div>
      <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-[#d87093]/10 rounded-full blur-xl hidden md:block"></div>

      <style jsx>{`
        @keyframes floatAnimation {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
