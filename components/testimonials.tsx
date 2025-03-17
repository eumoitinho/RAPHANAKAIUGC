"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Quote } from "lucide-react"

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "Maria Silva",
    role: "Diretora de Marketing, Marca X",
    image: "/placeholder.svg?height=100&width=100",
    text: "Trabalhar com a Rapha foi uma experiência incrível. Ela conseguiu capturar perfeitamente a essência da nossa marca e transformar nossa visão em imagens deslumbrantes que superaram todas as expectativas.",
  },
  {
    id: 2,
    name: "João Oliveira",
    role: "Editor-Chefe, Revista Y",
    image: "/placeholder.svg?height=100&width=100",
    text: "A criatividade e profissionalismo da Rapha são incomparáveis. Nosso editorial ganhou uma dimensão completamente nova graças ao seu olhar único e capacidade de contar histórias através de imagens.",
  },
  {
    id: 3,
    name: "Ana Costa",
    role: "CEO, Empresa Z",
    image: "/placeholder.svg?height=100&width=100",
    text: "A Rapha não é apenas uma fotógrafa talentosa, mas uma verdadeira parceira estratégica. Ela entendeu perfeitamente nossos objetivos de negócio e criou imagens que comunicam nossa mensagem de forma poderosa e autêntica.",
  },
]

export function Testimonials() {
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

    const element = document.getElementById("testimonials-section")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  return (
    <section id="testimonials" className="py-20 bg-[#f8f5f0]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm uppercase tracking-wider text-[#c17a54] font-medium mb-2">Depoimentos</h2>
          <h3 className="text-4xl font-bold mb-6">O que meus clientes dizem</h3>
          <p className="text-gray-600">
            Feedback de clientes e parceiros que confiaram em minha visão criativa e habilidades para seus projetos.
          </p>
        </div>

        <div id="testimonials-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`bg-white p-8 rounded-lg shadow-sm transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-[#c17a54] opacity-30" />
              </div>
              <p className="text-gray-600">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

