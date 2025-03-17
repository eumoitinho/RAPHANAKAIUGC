import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { BrandVideo } from "@/components/brand-video"
import { About } from "@/components/about"
import { Portfolio } from "@/components/portfolio"
import { Pricing } from "@/components/pricing"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <Navbar />
      <Hero />
      <BrandVideo />
      <About />
      <Portfolio />
      <Pricing />
      <Contact />
      <Footer />
    </main>
  )
}

