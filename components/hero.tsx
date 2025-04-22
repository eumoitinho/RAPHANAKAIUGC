import Image from "next/image"

export function Hero() {
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image src="/images/hero.png" alt="Rapha Nakai" fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif italic text-6xl md:text-8xl tracking-wide mb-6 opacity-90">
            <span className="block md:inline-block">Rapha</span>
            <span className="block md:inline-block md:ml-4">Nakai</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 max-w-xl mx-auto leading-relaxed">
            Criatividade e elegância em cada projeto
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <span className="text-sm uppercase tracking-widest mb-2">Scroll</span>
        <div className="w-px h-16 bg-white/50 animate-pulse"></div>
      </div>
    </section>
  )
}
