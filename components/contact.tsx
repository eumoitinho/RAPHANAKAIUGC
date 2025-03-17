import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, Mail, Phone, MapPin, Instagram } from "lucide-react"
import Link from "next/link"

export function Contact() {
  return (
    <section id="contato" className="py-24 bg-[#1e1e1e]">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-4xl font-serif italic mb-16 text-center text-[#d87093]">Contato</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <div>
            <form className="space-y-6">
              <div className="space-y-4">
                <Input placeholder="Nome" className="bg-[#252525] border-[#333333] focus:border-[#d87093] text-white" />

                <Input
                  type="email"
                  placeholder="Email"
                  className="bg-[#252525] border-[#333333] focus:border-[#d87093] text-white"
                />

                <Input
                  placeholder="Assunto"
                  className="bg-[#252525] border-[#333333] focus:border-[#d87093] text-white"
                />

                <Textarea
                  placeholder="Mensagem"
                  className="bg-[#252525] border-[#333333] focus:border-[#d87093] text-white min-h-[150px]"
                />
              </div>

              <Button className="w-full bg-[#d87093] hover:bg-[#c45c7c] text-white">
                <span className="flex items-center">
                  Enviar <Send size={16} className="ml-2" />
                </span>
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-medium mb-6 text-white">Informações de Contato</h3>

              <ul className="space-y-6">
                <li className="flex items-start">
                  <Mail className="mr-4 mt-1 text-[#d87093]" size={20} />
                  <div>
                    <p className="text-gray-400">Email</p>
                    <a href="mailto:rncbs2002@gmail.com" className="hover:text-[#d87093] transition-colors">
                      rncbs2002@gmail.com
                    </a>
                  </div>
                </li>

                <li className="flex items-start">
                  <Phone className="mr-4 mt-1 text-[#d87093]" size={20} />
                  <div>
                    <p className="text-gray-400">Telefone</p>
                    <a href="tel:+5511999999999" className="hover:text-[#d87093] transition-colors">
                      +55 (18) 98105-0201
                    </a>
                  </div>
                </li>

                <li className="flex items-start">
                  <MapPin className="mr-4 mt-1 text-[#d87093]" size={20} />
                  <div>
                    <p className="text-gray-400">Localização</p>
                    <p>Ilhabela, SP - Brasil</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-medium mb-6 text-white">Redes Sociais</h3>

              <div className="flex space-x-4">
                <a
                  href="https://instagram.com/raphanakai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center hover:bg-[#d87093] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram size={32} />
                </a>
                <Link
                  href="https://www.tiktok.com/@raphanakai?lang=pt-BR"
                  target="__blank"
                  className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center hover:bg-[#d87093] transition-colors"
                >
                  <svg
                    width={56}
                    height={56}
                    fill="#f4f0eb"
                    viewBox="0 0 48 48"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M38.0766847,15.8542954 C36.0693906,15.7935177 34.2504839,14.8341149 32.8791434,13.5466056 C32.1316475,12.8317108 31.540171,11.9694126 31.1415066,11.0151329 C30.7426093,10.0603874 30.5453728,9.03391952 30.5619062,8 L24.9731521,8 L24.9731521,28.8295196 C24.9731521,32.3434487 22.8773693,34.4182737 20.2765028,34.4182737 C19.6505623,34.4320127 19.0283477,34.3209362 18.4461858,34.0908659 C17.8640239,33.8612612 17.3337909,33.5175528 16.8862248,33.0797671 C16.4386588,32.6422142 16.0833071,32.1196657 15.8404292,31.5426268 C15.5977841,30.9658208 15.4727358,30.3459348 15.4727358,29.7202272 C15.4727358,29.0940539 15.5977841,28.4746337 15.8404292,27.8978277 C16.0833071,27.3207888 16.4386588,26.7980074 16.8862248,26.3604545 C17.3337909,25.9229017 17.8640239,25.5791933 18.4461858,25.3491229 C19.0283477,25.1192854 19.6505623,25.0084418 20.2765028,25.0219479 C20.7939283,25.0263724 21.3069293,25.1167239 21.794781,25.2902081 L21.794781,19.5985278 C21.2957518,19.4900128 20.7869423,19.436221 20.2765028,19.4380839 C18.2431278,19.4392483 16.2560928,20.0426009 14.5659604,21.1729264 C12.875828,22.303019 11.5587449,23.9090873 10.7814424,25.7878401 C10.003907,27.666593 9.80084889,29.7339663 10.1981162,31.7275214 C10.5953834,33.7217752 11.5748126,35.5530237 13.0129853,36.9904978 C14.4509252,38.4277391 16.2828722,39.4064696 18.277126,39.8028054 C20.2711469,40.1991413 22.3382874,39.9951517 24.2163416,39.2169177 C26.0948616,38.4384508 27.7002312,37.1209021 28.8296253,35.4300711 C29.9592522,33.7397058 30.5619062,31.7522051 30.5619062,29.7188301 L30.5619062,18.8324027 C32.7275484,20.3418321 35.3149087,21.0404263 38.0766847,21.0867664 L38.0766847,15.8542954 Z"
                      id="Fill-1"
                      fill="#FFFFFF"
                    ></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

