"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

const pricingPlans = [
  {
    name: "Pacote 1",
    description: "1 Vídeo + 2 Fotos UGC",
    price: "R$ 250,00",
    features: [
      "Alinhamento de briefing",
      "Direção criativa",
      "Ajustes e alterações",
      "2 meses de uso de imagem em ADS",
      "Roteiro",
      "Uso em redes sociais vitalício",
    ],
    popular: false,
  },
  {
    name: "Pacote 2",
    description: "2 Vídeos + 5 Fotos UGC",
    price: "R$ 657,00",
    features: [
      "Alinhamento de briefing",
      "Direção criativa",
      "Ajustes e alterações",
      "4 meses de uso de imagem em ADS",
      "Roteiro",
      "Uso em redes sociais vitalício",
    ],
    popular: true,
  },
  {
    name: "Pacote 3",
    description: "4 Vídeos + 10 Fotos UGC",
    price: "R$ 1.105,00",
    features: [
      "Alinhamento de briefing",
      "Direção criativa",
      "Ajustes e alterações",
      "6 meses de uso de imagem em ADS",
      "Roteiro",
      "Uso em redes sociais vitalício",
    ],
    popular: false,
  },
]


export function Pricing() {
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

    const element = document.getElementById("planos")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  return (
    <section id="planos" className="py-24 bg-[#1a1a1a]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#d87093] uppercase tracking-wider text-sm font-medium">Planos</span>
          <h2 className="text-4xl md:text-5xl font-serif italic mt-2 mb-6">Invista no seu projeto</h2>
          <p className="text-white/80 text-lg">
            Escolha o plano que melhor atende às necessidades do seu projeto e comece a criar imagens impactantes que
            comunicam sua mensagem de forma autêntica.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`bg-[#252525] border-none transition-all duration-500 transform ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              } ${plan.popular ? "relative shadow-lg shadow-[#d87093]/20 ring-2 ring-[#d87093]" : "hover:shadow-lg"}`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-[#d87093] text-white text-xs font-medium px-3 py-1 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-serif">{plan.name}</CardTitle>
                <CardDescription className="text-white/60">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-6">
                  <span className="text-4xl font-serif text-white">{plan.price}</span>
                  <span className="text-white/60 ml-2">por projeto</span>
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-[#d87093] mr-2 flex-shrink-0" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-[#d87093] hover:bg-[#c45c7c] text-white"
                      : "bg-[#333333] hover:bg-[#444444] text-white"
                  }`}
                  onClick={() => {
                    const msg = encodeURIComponent(`Olá Rapha, queria saber mais sobre o ${plan.name} (${plan.description})!`);
                    const url = `https://wa.me/5518981050201?text=${msg}`;
                    window.open(url, '_blank');
                  }}
                >
                  Selecionar Plano
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
