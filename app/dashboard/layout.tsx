"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DashboardSidebar from "@/components/DashboardSidebar"
import DashboardHeader from "@/components/DashboardHeader"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Alterando estado inicial para false (sidebar expandida por padrão)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        setUser(user)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else if (session?.user) {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-effect rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-blue-dark)] mx-auto mb-4"></div>
          <p className="text-[var(--primary-blue-dark)]">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-effect rounded-2xl p-8 text-center">
          <p className="text-[var(--primary-blue-dark)]">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-effect border-white/20 p-4 sm:p-6 text-black">
      {/* Sidebar - MODELO PADRÃO DAS PÁGINAS PRINCIPAIS */}
      <DashboardSidebar onToggle={(isOpen) => setSidebarCollapsed(!isOpen)} />

      {/* MAIN CONTENT - AJUSTADO PARA MOVER COM A SIDEBAR */}
      <div
        className={`flex-1 relative z-10 transition-all duration-300 ${sidebarCollapsed ? "ml-0" : "ml-0 lg:ml-48"}`} // Invertendo lógica: quando sidebar está collapsed (fechada), sem margem. Quando não está collapsed (aberta), com margem
      >
        <DashboardHeader
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="p-4 lg:p-6 pt-20">{children}</main>
      </div>

      <Toaster />
    </div>
  )
}
