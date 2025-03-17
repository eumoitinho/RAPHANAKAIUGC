export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-8 bg-black border-t border-[#333333]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© {currentYear} Rapha Nakai. Todos os direitos reservados.</p>

          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li>
                <a href="#sobre" className="text-sm text-gray-400 hover:text-[#d87093] transition-colors">
                  Sobre
                </a>
              </li>
              <li>
                <a href="#projetos" className="text-sm text-gray-400 hover:text-[#d87093] transition-colors">
                  Projetos
                </a>
              </li>
              <li>
                <a href="#contato" className="text-sm text-gray-400 hover:text-[#d87093] transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

