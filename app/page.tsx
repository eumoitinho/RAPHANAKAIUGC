import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Services } from "@/components/services"
import { Portfolio } from "@/components/portfolio"
import { Pricing } from "@/components/pricing"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { FeaturedSection } from "@/components/featured-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <Navbar />
      <Hero />
      <FeaturedSection />
      <About />
      <Services />
      <Portfolio />
      <Pricing />
      <Contact />
      <Footer />
    </main>
  )
}
