"use client"

import { useState } from "react"
import { Check, MessageCircleHeartIcon, Sparkles } from "lucide-react"
import { Button } from "./ui/button"

export function Pricing() {
  const [annualBilling, setAnnualBilling] = useState(false)
  const [plan, setPlan] = useState<string>('');

  const handlePlanClick = (selectedPlan: { name: string; description: string }) => {
    const { name, description } = selectedPlan;

    const mensagem = `Oii Rapha, gostaria de saber mais sobre o plano *${name}* - ${description}.`;

    // Codifica a mensagem para ser usada na URL
    const mensagemCodificada = encodeURIComponent(mensagem);

    // Abre o WhatsApp com a mensagem pré-preenchida
    window.open(`https://api.whatsapp.com/send?phone=5518981050201&text=${mensagemCodificada}`);
  };


  const plans = [
    {
      name: "Pacote 1",
      description: "1 Video + 2 Fotos UGC",
      price: "R$250,00",
      popular: false,
      features: [
        "Alinhamento de briefing",
        "Direção criativa",
        "Ajustes e alterações",
        "2 meses de uso de imagem em ADS",
        "Roteiro",
        "Uso em redes sociais vitalício",
      ],
    },
    {
      name: "Pacote 2",
      description: "2 Videos + 5 Fotos UGC",
      price: "R$657,00",
      popular: true,
      features: [
        "Alinhamento de briefing",
        "Direção criativa",
        "Ajustes e alterações",
        "4 meses de uso de imagem em ADS",
        "Roteiro",
        "Uso em redes sociais vitalício",
      ],
    },
    {
      name: "Pacote 3",
      description: "4 Videos + 10 Fotos UGC",
      price: "R$1.105,00",
      popular: false,
      features: [
        "Alinhamento de briefing",
        "Direção criativa",
        "Ajustes e alterações",
        "6 meses de uso de imagem em ADS",
        "Roteiro",
        "Uso em redes sociais vitalício",
      ],
    },
  ]


  return (
    <section id="planos" className="py-24 bg-[#121212] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 border border-[#d87093]/20 rounded-full opacity-30"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 border border-[#d87093]/10 rounded-full opacity-20"></div>
      <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-[#d87093]/30 rounded-full blur-sm"></div>
      <div className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-[#d87093]/20 rounded-full blur-sm"></div>

      {/* Star decorations */}
      <div className="absolute top-40 left-10 text-[#d87093]/30 text-4xl">✧</div>
      <div className="absolute bottom-40 right-10 text-[#d87093]/20 text-3xl">✦</div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center mb-4">
            <span className="text-3xl text-[#d87093]/70 mr-2">✧</span>
            <h2 className="text-4xl md:text-5xl font-bold text-[#fff5dc]">TABELA DE VALORES</h2>
            <span className="text-3xl text-[#d87093]/70 ml-2">✦</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-right text-white/90">2025</h3>
          <p className="mt-6 text-gray-300">
            Escolha o pacote ideal para suas necessidades de conteúdo UGC e eleve sua marca com produções autênticas e
            de alta qualidade.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-xl overflow-hidden ${plan.popular
                  ? "bg-gradient-to-b from-[#d87093]/90 to-[#d87093]/70 shadow-lg shadow-[#d87093]/20"
                  : "bg-[#1e1e1e]"
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-white text-[#d87093] font-medium text-sm px-4 py-1 rounded-bl-lg">
                  <div className="flex items-center">
                    <Sparkles size={14} className="mr-1" />
                    Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-lg ${plan.popular ? "text-white/90" : "text-gray-400"}`}>{plan.description}</p>

                <div className="mt-6 mb-8">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`${plan.popular ? "text-white/80" : "text-gray-400"}`}> / projeto</span>
                </div>

                <Button
                  onClick={() => handlePlanClick(plan)} // Agora passa o plano inteiro
                  className={`w-full ${plan.popular
                      ? "bg-white text-[#d87093] hover:bg-gray-100"
                      : "bg-[#d87093] text-white hover:bg-[#c45c7c]"
                    }`}
                >
                  <MessageCircleHeartIcon />
                  Selecionar Plano
                </Button>

                <div className="mt-8">
                  <p className={`font-medium mb-4 ${plan.popular ? "text-white" : "text-white/90"}`}>Entregáveis</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check
                          size={18}
                          className={`mr-2 mt-0.5 flex-shrink-0 ${plan.popular ? "text-white" : "text-[#d87093]"}`}
                        />
                        <span className={plan.popular ? "text-white/90" : "text-gray-300"}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="mt-2 text-gray-400">
            Precisa de um pacote personalizado?{" "}
            <a href="#contato" className="text-[#d87093] hover:underline">
              Entre em contato
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}

