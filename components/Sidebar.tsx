"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ChevronLeft, Home, Bell, Grid3X3, FileText, Building, Book } from 'lucide-react'

interface SidebarProps {
  currentPage?: string
  onToggle?: (isOpen: boolean) => void
  hideToggleButton?: boolean
}

export default function Sidebar({ currentPage = "inicio", onToggle, hideToggleButton = false }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { href: "/", icon: Home, label: "Início", key: "inicio" },
    { href: "/atendimento", icon: Bell, label: "Atendimento", key: "atendimento" },
    { href: "/portfolio", icon: Grid3X3, label: "Portfólio", key: "portfolio" },
    { href: "/blog", icon: FileText, label: "Blog Diário", key: "blog" },
    { href: "/instalacoes", icon: Building, label: "Instalações", key: "instalacoes" },
    { href: "/historia", icon: Book, label: "Nossa História", key: "historia" },
  ]

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    if (onToggle) {
      onToggle(newState)
    }
  }

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen w-44 bg-[var(--primary-blue-dark)] text-white p-4 shadow-2xl z-[1000] transition-transform duration-300 ease-in-out border-r border-white/10 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:w-48`}
      >
        {!hideToggleButton && (
          <button
            onClick={handleToggle}
            className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--primary-blue-dark)] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[var(--primary-blue-medium)] hover:scale-110 transition-all duration-300"
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        )}

        <div className="flex justify-center p-2 mb-4 border-b border-white/20">
          <Link href="/" className="block w-20 h-20 relative hover:scale-105 transition-transform duration-300">
            <Image src="/LOGO2.png" alt="Design Vidraçaria" fill className="object-cover rounded" />
          </Link>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.key

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center p-2 rounded-md transition-all duration-300 relative overflow-hidden shimmer-effect ${
                  isActive
                    ? "bg-[var(--secondary-blue)] text-white font-semibold"
                    : "hover:bg-[var(--primary-blue-medium)] hover:pl-3"
                }`}
              >
                <Icon size={16} className="mr-2 min-w-[16px]" />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-white/20 text-xs text-white/70 text-center leading-tight">
          © 2025 Design Vidraçaria. Todos os direitos reservados.
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[999] lg:hidden" onClick={handleToggle} />}
    </>
  )
}
