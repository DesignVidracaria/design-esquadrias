"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X, ChevronUp, User } from "lucide-react"

interface HeaderProps {
  currentPage?: string
  onHeaderToggle?: (isVisible: boolean) => void
  sidebarOpen?: boolean
}

export default function Header({ currentPage = "inicio", onHeaderToggle, sidebarOpen }: HeaderProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)
  const prevIsVisible = useRef(false)

  const menuItems = [
    { href: "/", label: "Início", key: "inicio" },
    { href: "/atendimento", label: "Atendimento", key: "atendimento" },
    { href: "/portfolio", label: "Portfólio", key: "portfolio" },
    { href: "/blog", label: "Blog", key: "blog" },
    { href: "/instalacoes", label: "Instalações", key: "instalacoes" },
    { href: "/historia", label: "Nossa História", key: "historia" },
  ]

  useEffect(() => {
    const savedState = localStorage.getItem("header_visibility")
    if (savedState !== null) {
      setIsVisible(savedState === "true")
    }
  }, [])

  useEffect(() => {
    if (onHeaderToggle) {
      onHeaderToggle(isVisible)
    }
    localStorage.setItem("header_visibility", isVisible.toString())

    if (!prevIsVisible.current && isVisible) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    prevIsVisible.current = isVisible
  }, [isVisible, onHeaderToggle])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const newIsAtTop = scrollTop < 50

      if (newIsAtTop !== isAtTop) {
        setIsAtTop(newIsAtTop)
      }

      if (isVisible && !newIsAtTop) {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isVisible, isAtTop])

  const handleButtonClick = () => {
    if (isAtTop) {
      toggleHeader()
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const toggleHeader = () => {
    setIsVisible(!isVisible)
  }

  return (
    <>
      <Link
        href="/acesso"
        className="fixed top-4 left-4 z-[9999] flex items-center gap-2 px-3 py-2 bg-[var(--secondary-blue)]/90 backdrop-blur-md rounded-full text-white text-sm font-semibold shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[var(--secondary-blue)]"
      >
        <User size={16} />
        <span className="hidden sm:inline">Login</span>
      </Link>

      <button
        onClick={handleButtonClick}
        className={`fixed top-4 right-4 z-[9999] w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary-blue-dark)]/90 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[var(--primary-blue-dark)] ${
          isVisible ? "rotate-180" : "rotate-0"
        } ${sidebarOpen ? "right-4" : "right-4"}`}
        style={{
          zIndex: 9999,
        }}
      >
        {!isAtTop ? <ChevronUp size={24} /> : isVisible ? <X size={24} /> : <Menu size={24} />}
      </button>

      <header
        className={`relative z-[9998] transition-all duration-500 ease-in-out overflow-hidden ${
          isVisible ? "h-auto opacity-100" : "h-0 opacity-0"
        }`}
      >
        <div className="bg-[var(--primary-blue-dark)]/90 backdrop-blur-md border-b border-white/20 shadow-xl">
          <div className="flex flex-col items-center p-2 sm:p-3 lg:p-4 xl:p-6 lg:py-4">
            <nav className="flex flex-col items-center gap-y-1 w-full px-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2 lg:gap-3 xl:gap-5">
              {/* Primeira linha com 4 links (APENAS NO MOBILE) */}
              <div className="flex flex-nowrap justify-center gap-x-1 w-full sm:hidden">
                {menuItems.slice(0, 4).map((item) => {
                  const isActive = currentPage === item.key
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => toggleHeader()}
                      className={`text-center px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? "bg-[var(--secondary-blue)] text-white"
                          : "text-white hover:text-[var(--secondary-blue)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
              {/* Segunda linha com 2 links (APENAS NO MOBILE) */}
              <div className="flex justify-center gap-x-1 w-full sm:hidden">
                {menuItems.slice(4, 6).map((item) => {
                  const isActive = currentPage === item.key
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => toggleHeader()}
                      className={`text-center px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? "bg-[var(--secondary-blue)] text-white"
                          : "text-white hover:text-[var(--secondary-blue)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>

              {/* Versão para telas maiores (sm em diante) - UMA ÚNICA LINHA */}
              <div className="hidden sm:flex sm:flex-wrap sm:justify-center sm:gap-2 lg:gap-3 xl:gap-5">
                {menuItems.map((item) => {
                  const isActive = currentPage === item.key
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => toggleHeader()}
                      className={`text-center px-2.5 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? "bg-[var(--secondary-blue)] text-white"
                          : "text-white hover:text-[var(--secondary-blue)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  )
}
