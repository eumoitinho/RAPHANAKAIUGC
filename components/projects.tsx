import Image from "next/image"
import { Button } from "@/components/ui/button"

// Sample project data
const projects = [
  {
    id: 1,
    title: "Campanha Visual",
    description: "Desenvolvimento de identidade visual para marca de moda sustentável.",
    image: "/placeholder.svg?height=600&width=800",
    tags: ["Branding", "Fotografia"],
  },
  {
    id: 2,
    title: "Website Corporativo",
    description: "Redesign completo de presença digital para empresa de tecnologia.",
    image: "/placeholder.svg?height=600&width=800",
    tags: ["Web Design", "UX/UI"],
  },
  {
    id: 3,
    title: "Editorial de Moda",
    description: "Direção criativa e produção de editorial para revista de moda.",
    image: "/placeholder.svg?height=600&width=800",
    tags: ["Direção Criativa", "Styling"],
  },
]

export function Projects() {
  return (
    <section id="projetos" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-serif italic mb-16 text-center">Projetos</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative overflow-hidden rounded-lg bg-neutral-900 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-medium mb-2">{project.title}</h3>
                <p className="text-gray-400 mb-4">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-neutral-800 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-2">
                  Ver detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button variant="default" size="lg">
            Ver todos os projetos
          </Button>
        </div>
      </div>
    </section>
  )
}

