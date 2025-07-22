"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Send, Instagram, Facebook, Youtube } from "lucide-react"

export function Contact() {
  const [isVisible, setIsVisible] = useState(false)
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

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

    const element = document.getElementById("contato")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formState)
    // Here you would typically send the form data to your backend
    alert("Mensagem enviada com sucesso!")
    setFormState({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
  }

  return (
    <section id="contato" className="py-24 bg-[#121212]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#d87093] uppercase tracking-wider text-sm font-medium">Contato</span>
          <h2 className="text-4xl md:text-5xl font-serif italic mt-2 mb-6">Vamos Trabalhar Juntos</h2>
          <p className="text-white/80 text-lg">
            Entre em contato para discutirmos seu projeto e como posso ajudar a criar conteúdo visual impactante para
            sua marca.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div
            className={`transition-all duration-1000 transform ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-white">
                    Nome
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    required
                    className="bg-[#252525] border-[#333] focus:border-[#d87093] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-white">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    className="bg-[#252525] border-[#333] focus:border-[#d87093] text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-white">
                  Assunto
                </label>
                <Input
                  id="subject"
                  name="subject"
                  value={formState.subject}
                  onChange={handleChange}
                  placeholder="Assunto da mensagem"
                  required
                  className="bg-[#252525] border-[#333] focus:border-[#d87093] text-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-white">
                  Mensagem
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  placeholder="Sua mensagem"
                  required
                  className="min-h-[150px] bg-[#252525] border-[#333] focus:border-[#d87093] text-white"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#d87093] hover:bg-[#c45c7c] text-white group transition-all duration-300 hover:shadow-lg hover:scale-[1.02] "
              >
                Enviar Mensagem
                <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div
            className={`transition-all duration-1000 transform ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="bg-[#1a1a1a] rounded-lg p-8 h-full">
              <h3 className="text-2xl font-medium mb-6">Informações de Contato</h3>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#d87093]/10 flex items-center justify-center mr-4 text-[#d87093]">
                    <MapPin />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">Localização</h4>
                    <p className="text-white/70 mt-1">Ilhabela, SP - Brasil</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#d87093]/10 flex items-center justify-center mr-4 text-[#d87093]">
                    <Phone />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">Telefone</h4>
                    <p className="text-white/70 mt-1">+55 (18) 98105-0201</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-[#d87093]/10 flex items-center justify-center mr-4 text-[#d87093]">
                    <Mail />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">Email</h4>
                    <p className="text-white/70 mt-1">raphanakai@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <h4 className="text-lg font-medium mb-4">Me siga no Instagram</h4>
                <div className="flex space-x-4">
                  <a
                    href="https://instagram.com/raphanakai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center text-white hover:bg-[#d87093] transition-colors"
                  >
                    <Instagram size={18} />
                  </a>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
