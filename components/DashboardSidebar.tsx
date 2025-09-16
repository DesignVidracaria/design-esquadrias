"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  ChevronLeft,
  Home,
  MessageSquare,
  History,
  Grid3X3,
  Plus,
  User,
  Upload,
  Package,
  FileText,
} from "lucide-react"
import { supabase, type Profile } from "@/lib/supabase"

interface DashboardSidebarProps {
  currentPage?: string
  onToggle?: (isOpen: boolean) => void
  hideToggleButton?: boolean
}

export default function DashboardSidebar({ currentPage, onToggle, hideToggleButton = false }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    if (onToggle) {
      onToggle(newState)
    }
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user?.id) {
          setLoading(false)
          return
        }

        // Tenta buscar o perfil na tabela 'profiles'
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, nome, email, tipo_usuario, ativo, foto_perfil, nickname")
          .eq("id", user.id)
          .single()

        if (profile && !profileError) {
          setUserProfile(profile)
        } else if (profileError && profileError.code === "PGRST116") {
          // Se o perfil não existe na tabela 'profiles', verifica em 'clientes' e 'arquitetos'
          const { data: clienteData, error: clienteError } = await supabase
            .from("clientes")
            .select("id, nome, email")
            .eq("id", user.id)
            .single()

          if (clienteData && !clienteError) {
            setUserProfile({
              ...clienteData,
              tipo_usuario: "cliente",
              ativo: true,
              foto_perfil: null,
              nickname: clienteData.nome.split(" ")[0] || "Cliente",
            })
          } else {
            const { data: arquitetoData, error: arquitetoError } = await supabase
              .from("arquitetos")
              .select("id, nome, email")
              .eq("id", user.id)
              .single()

            if (arquitetoData && !arquitetoError) {
              setUserProfile({
                ...arquitetoData,
                tipo_usuario: "arquiteto",
                ativo: true,
                foto_perfil: null,
                nickname: arquitetoData.nome.split(" ")[0] || "Arquiteto",
              })
            } else {
              // Se não encontrou em nenhuma das tabelas, define como vendedor padrão
              const { data: newProfile, error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  nome: user.user_metadata?.nome || user.email?.split("@")[0] || "Usuário",
                  email: user.email,
                  tipo_usuario: "vendedor",
                  ativo: true,
                })
                .select("id, nome, email, tipo_usuario, ativo, foto_perfil, nickname")
                .single()

              if (!insertError && newProfile) {
                const profileWithNickname = {
                  ...newProfile,
                  nickname:
                    newProfile.nickname ||
                    newProfile.nome?.split(" ")[0] ||
                    newProfile.email?.split("@")[0] ||
                    "Usuário",
                }
                setUserProfile(profileWithNickname)
              }
            }
          }
        } else {
          console.error("Erro ao buscar perfil no sidebar:", profileError)
        }
      } catch (error) {
        console.error("Erro geral ao buscar perfil no sidebar:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()

    const profileSubscription = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (payload.new) {
            setUserProfile(payload.new as Profile)
          }
        },
      )
      .subscribe()

    return () => {
      profileSubscription.unsubscribe()
    }
  }, [])

  const systemMenuItems = [
    { href: "/dashboard/criar-post", icon: Plus, label: "Criar Post", key: "criar-post", adminOnly: true },
    {
      href: "/dashboard/inserir-imagens",
      icon: Upload,
      label: "Inserir Imagens",
      key: "inserir-imagens",
      adminOnly: true,
    },
    {
      href: "/dashboard/adicionar-item",
      icon: Grid3X3,
      label: "Adicionar Item",
      key: "adicionar-item",
      adminOnly: true,
    },
  ]

  const salesMenuItems = [
    { href: "/dashboard/historico", icon: History, label: "Atendimentos", key: "atendimentos" },
    { href: "/dashboard/atendimento", icon: MessageSquare, label: "Novo Atendimento", key: "atendimento" },
    { href: "/dashboard/orcamentos", icon: FileText, label: "Orçamentos", key: "orcamentos" },
    { href: "/dashboard/novo-orcamento", icon: Plus, label: "Novo Orçamento", key: "novo-orcamento" },
    { href: "/dashboard/nova-obra", icon: Package, label: "Nova Obra", key: "nova-obra" },
  ]

  const filterMenuItems = (items: typeof systemMenuItems) => {
    return items.filter((item) => {
      if (item.adminOnly && userProfile?.tipo_usuario !== "administrador") {
        return false
      }
      return true
    })
  }

  const getCurrentPageKey = () => {
    if (pathname === "/dashboard") return "dashboard"
    if (pathname === "/dashboard/atendimento") return "atendimento"
    if (pathname === "/dashboard/historico") return "atendimentos"
    if (pathname === "/dashboard/novo-orcamento") return "novo-orcamento"
    if (pathname === "/dashboard/orcamentos") return "orcamentos"
    if (pathname === "/dashboard/nova-obra") return "nova-obra"
    if (pathname === "/dashboard/criar-post") return "criar-post"
    if (pathname === "/dashboard/adicionar-item") return "adicionar-item"
    if (pathname === "/dashboard/inserir-imagens") return "inserir-imagens"
    return currentPage || "dashboard"
  }

  const getDisplayName = () => {
    if (userProfile?.nickname) return userProfile.nickname
    if (userProfile?.nome) return userProfile.nome
    if (userProfile?.email) return userProfile.email.split("@")[0]
    return "Usuário"
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

        <nav className="space-y-1 mb-4">
          <Link
            href="/dashboard"
            className={`flex items-center p-2 rounded-md transition-all duration-300 relative overflow-hidden shimmer-effect ${
              getCurrentPageKey() === "dashboard"
                ? "bg-[var(--secondary-blue)] text-white font-semibold"
                : "hover:bg-[var(--primary-blue-medium)] hover:pl-3"
            }`}
          >
            <Home size={16} className="mr-2 min-w-[16px]" />
            <span className="text-sm">Dashboard</span>
          </Link>
        </nav>

        <div className="mb-4">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-2">Atendimento/Vendas</h3>
          <nav className="space-y-1">
            {filterMenuItems(salesMenuItems).map((item) => {
              const Icon = item.icon
              const isActive = getCurrentPageKey() === item.key

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
        </div>

        {userProfile?.tipo_usuario === "administrador" && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 px-2">Sistema</h3>
            <nav className="space-y-1">
              {filterMenuItems(systemMenuItems).map((item) => {
                const Icon = item.icon
                const isActive = getCurrentPageKey() === item.key

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
          </div>
        )}

        <div className="absolute bottom-16 left-4 right-4 mb-4">
          <div className="p-2 bg-slate-800/90 rounded-lg border border-white/30">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 relative rounded-full overflow-hidden bg-slate-700/80 flex-shrink-0">
                {userProfile?.foto_perfil ? (
                  <img
                    src={userProfile.foto_perfil || "/placeholder.svg"}
                    alt="Foto do perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User size={14} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-slate-100 font-semibold text-xs truncate">{getDisplayName()}</h4>
                <p className="text-slate-300 text-xs">
                  {userProfile?.tipo_usuario === "administrador" ? "Admin" : "Vendedor"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 pt-4 border-t border-white/20 text-xs text-slate-300 text-center leading-tight">
          © 2025 Design Vidraçaria. Todos os direitos reservados.
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[999] lg:hidden" onClick={handleToggle} />}
    </>
  )
}
