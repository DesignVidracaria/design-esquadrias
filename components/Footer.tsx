import Link from "next/link"

interface FooterProps {
  currentPage?: string
  showLogin?: boolean
}

export default function Footer({ currentPage = "inicio", showLogin = false }: FooterProps) {
  const menuItems = [
    { href: "/", label: "Início", key: "inicio" },
    { href: "/atendimento", label: "Atendimento", key: "atendimento" },
    { href: "/portfolio", label: "Portfólio", key: "portfolio" },
    { href: "/blog", label: "Blog", key: "blog" },
    { href: "/instalacoes", label: "Instalações", key: "instalacoes" },
    { href: "/historia", label: "Nossa História", key: "historia" },
  ]

  return (
    <footer className="glass-effect rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-8 mt-4 sm:mt-6 text-center shadow-xl mx-1 sm:mx-2 lg:mx-0 lg:mt-4">
      {/* --- INÍCIO DA ALTERAÇÃO --- */}
      {/* Removido o div com 'overflow-x-auto'. A navegação agora usa flex-wrap para se ajustar. */}
      <div className="w-full pb-3 sm:pb-4 lg:pb-6 border-b border-white/20">
        {/* O espaçamento (gap) e o tamanho da fonte (text) foram reduzidos. */}
        <nav className="flex items-center justify-center flex-wrap gap-1 sm:gap-2 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
          {menuItems.map((item) => {
            const isActive = currentPage === item.key

            return (
              <Link
                key={item.key}
                href={item.href}
                // Padding (px, py) e tamanho da fonte (text) foram reduzidos.
                className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300 relative ${
                  isActive
                    ? "bg-[var(--secondary-blue)] text-white font-semibold"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            )
          })}

          {/* Mostrar Login apenas na página Atendimento */}
          {currentPage === "atendimento" && (
            <Link
              href="/login"
              className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-300 relative text-white/85 hover:text-white hover:bg-white/10"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
      {/* --- FIM DA ALTERAÇÃO --- */}

      {/* Copyright responsivo */}
      <p className="text-white/85 text-xs sm:text-sm tracking-wide px-2 pt-3 sm:pt-4 lg:pt-6">
        © 2025 Design Vidraçaria. Todos os direitos reservados.
      </p>
    </footer>
  )
}
