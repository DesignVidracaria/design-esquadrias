"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  ArrowLeft, 
  Loader2, 
  Building2, 
  AlertCircle,
  FileText,
  Download,
  Calendar,
  DollarSign,
  MessageCircle,
  LogOut,
  Home
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type UserProfile = {
  id: string
  nome: string
  telefone: string
  endereco: string
  cpf_cnpj: string
  cidade: string
  estado: string
  data_nascimento?: string // apenas para cliente
  cau?: string // apenas para arquiteto
  especialidade?: string // apenas para arquiteto
}

type Orcamento = {
  id: string
  numero_orcamento: string
  cliente_id: string
  arquiteto_id: string | null
  vendedor: string | null
  responsavel_obra: string | null
  observacao: string | null
  arquivos: any[]
  created_at: string
  updated_at: string
  clientes: { nome: string } | null
  arquitetos: { nome: string } | null
}

export default function AcessoPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userType, setUserType] = useState<"cliente" | "arquiteto" | null>(null)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loadingOrcamentos, setLoadingOrcamentos] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const searchParams = useSearchParams()
  const router = useRouter()
  const message = searchParams.get("message")

  useEffect(() => {
    checkUserSession()
  }, [])

  useEffect(() => {
    if (isLoggedIn && userProfile) {
      fetchUserOrcamentos()
    }
  }, [isLoggedIn, userProfile])

  const checkUserSession = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        setIsLoggedIn(false)
        return
      }

      // Verificar se é cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", user.id)
        .single()

      if (clienteData && !clienteError) {
        setUserProfile(clienteData)
        setUserType("cliente")
        setIsLoggedIn(true)
        router.push("/profile")
        return
      }

      // Verificar se é arquiteto
      const { data: arquitetoData, error: arquitetoError } = await supabase
        .from("arquitetos")
        .select("*")
        .eq("id", user.id)
        .single()

      if (arquitetoData && !arquitetoError) {
        setUserProfile(arquitetoData)
        setUserType("arquiteto")
        setIsLoggedIn(true)
        router.push("/profile")
        return
      }

      // Verificar se é um usuário da tabela 'profiles' (admin/vendedor)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData && !profileError) {
        // Se for admin/vendedor, redirecionar para o dashboard
        router.push("/dashboard")
        return
      }

      // Se não encontrou em nenhuma tabela, fazer logout
      await supabase.auth.signOut()
      setIsLoggedIn(false)
      router.push("/acesso?message=" + encodeURIComponent("Usuário não encontrado ou sem permissão de acesso."))

    } catch (error) {
      console.error("Erro ao verificar sessão:", error)
      setIsLoggedIn(false)
    }
  }

  const fetchUserOrcamentos = async () => {
    if (!userProfile || !userType) return

    setLoadingOrcamentos(true)
    try {
      let query = supabase
        .from("orcamentos")
        .select(`
          id,
          numero_orcamento,
          cliente_id,
          arquiteto_id,
          vendedor,
          responsavel_obra,
          observacao,
          arquivos,
          created_at,
          updated_at,
          clientes(nome),
          arquitetos(nome)
        `)
        .order("created_at", { ascending: false })

      if (userType === "cliente") {
        query = query.eq("cliente_id", userProfile.id)
      } else if (userType === "arquiteto") {
        query = query.eq("arquiteto_id", userProfile.id)
      }

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar orçamentos:", error)
      } else {
        setOrcamentos(data as Orcamento[])
      }
    } catch (error) {
      console.error("Erro geral ao buscar orçamentos:", error)
    } finally {
      setLoadingOrcamentos(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("Erro ao fazer login.")
      }

      // Verificar se é cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (clienteData && !clienteError) {
        setUserProfile(clienteData)
        setUserType("cliente")
        setIsLoggedIn(true)
        router.push("/profile")
        return
      }

      // Verificar se é arquiteto
      const { data: arquitetoData, error: arquitetoError } = await supabase
        .from("arquitetos")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (arquitetoData && !arquitetoError) {
        setUserProfile(arquitetoData)
        setUserType("arquiteto")
        setIsLoggedIn(true)
        router.push("/profile")
        return
      }

      // Se não encontrou em nenhuma tabela
      await supabase.auth.signOut()
      throw new Error("Usuário não encontrado como cliente ou arquiteto.")

    } catch (error: any) {
      console.error("Login error:", error)
      router.push(`/acesso?message=${encodeURIComponent(error.message || "Erro ao fazer login")}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setIsLoggedIn(false)
      setUserProfile(null)
      setUserType(null)
      setOrcamentos([])
      setFormData({ email: "", password: "" })
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleDownloadFile = (arquivo: any) => {
    if (arquivo.url) {
      window.open(arquivo.url, "_blank")
    }
  }

  if (isLoggedIn && userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary-blue-dark)]/90 via-[var(--primary-blue-medium)]/85 to-[var(--primary-blue-light)]/80 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative">
                  <Image src="/LOGO.png" alt="Design Vidraçaria" fill className="object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Painel do {userType === "cliente" ? "Cliente" : "Arquiteto"}
                  </h1>
                  <p className="text-white/80">Bem-vindo, {userProfile.nome}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/">
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Home size={16} className="mr-2" />
                    Início
                  </Button>
                </Link>
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <LogOut size={16} className="mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>

          {/* Informações do usuário */}
          <div className="glass-effect rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Suas Informações</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-white/60">Nome:</span>
                <p className="text-white font-medium">{userProfile.nome}</p>
              </div>
              <div>
                <span className="text-white/60">Telefone:</span>
                <p className="text-white font-medium">{userProfile.telefone || "Não informado"}</p>
              </div>
              <div>
                <span className="text-white/60">Cidade:</span>
                <p className="text-white font-medium">{userProfile.cidade || "Não informado"}</p>
              </div>
              <div>
                <span className="text-white/60">Estado:</span>
                <p className="text-white font-medium">{userProfile.estado || "Não informado"}</p>
              </div>
              <div>
                <span className="text-white/60">CPF/CNPJ:</span>
                <p className="text-white font-medium">{userProfile.cpf_cnpj || "Não informado"}</p>
              </div>
              {userType === "cliente" && userProfile.data_nascimento && (
                <div>
                  <span className="text-white/60">Data de Nascimento:</span>
                  <p className="text-white font-medium">
                    {new Date(userProfile.data_nascimento).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
              {userType === "arquiteto" && userProfile.cau && (
                <div>
                  <span className="text-white/60">CAU:</span>
                  <p className="text-white font-medium">{userProfile.cau}</p>
                </div>
              )}
              {userType === "arquiteto" && userProfile.especialidade && (
                <div>
                  <span className="text-white/60">Especialidade:</span>
                  <p className="text-white font-medium">{userProfile.especialidade}</p>
                </div>
              )}
            </div>
          </div>

          {/* Orçamentos */}
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {userType === "cliente" ? "Seus Orçamentos" : "Orçamentos Vinculados"}
              </h2>
              <Badge variant="secondary" className="bg-[var(--secondary-blue)] text-white">
                {orcamentos.length} orçamento{orcamentos.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {loadingOrcamentos ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-white" size={32} />
                <span className="ml-2 text-white">Carregando orçamentos...</span>
              </div>
            ) : orcamentos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orcamentos.map((orcamento) => (
                  <Card key={orcamento.id} className="glass-effect border-white/20 p-4">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg font-bold text-white">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-[var(--secondary-blue)]" />
                            <span className="text-sm">{orcamento.numero_orcamento}</span>
                          </div>
                        </CardTitle>
                        <Badge variant="secondary" className="bg-[var(--secondary-blue)] text-white text-xs">
                          {new Date(orcamento.created_at).toLocaleDateString("pt-BR")}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        {userType === "arquiteto" && (
                          <div className="flex items-center gap-2 text-white/80">
                            <User size={14} />
                            <span>Cliente: {orcamento.clientes?.nome || "Não informado"}</span>
                          </div>
                        )}
                        
                        {userType === "cliente" && orcamento.arquitetos && (
                          <div className="flex items-center gap-2 text-white/80">
                            <Building2 size={14} />
                            <span>Arquiteto: {orcamento.arquitetos.nome}</span>
                          </div>
                        )}

                        {orcamento.vendedor && (
                          <div className="flex items-center gap-2 text-white/80">
                            <DollarSign size={14} />
                            <span>Vendedor: {orcamento.vendedor}</span>
                          </div>
                        )}

                        {orcamento.responsavel_obra && (
                          <div className="flex items-center gap-2 text-white/80">
                            <User size={14} />
                            <span>Responsável: {orcamento.responsavel_obra}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-0">
                      {orcamento.observacao && (
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2 text-sm">Observação</h4>
                          <p className="text-white/70 text-xs bg-white/5 p-2 rounded">
                            {orcamento.observacao}
                          </p>
                        </div>
                      )}

                      {orcamento.arquivos && orcamento.arquivos.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-2 text-sm">
                            Arquivos ({orcamento.arquivos.length})
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {orcamento.arquivos.map((arquivo, index) => (
                              <div key={index} className="flex items-center justify-between bg-white/10 p-2 rounded-md">
                                <div className="flex items-center gap-2 text-white text-xs truncate">
                                  <FileText size={12} />
                                  <span className="truncate">{arquivo.nome_original || `Arquivo ${index + 1}`}</span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleDownloadFile(arquivo)}
                                  className="bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white ml-2 h-6 px-2"
                                >
                                  <Download size={10} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto mb-4 text-white/40" size={40} />
                <h3 className="text-lg font-medium text-white mb-2">
                  {userType === "cliente" ? "Nenhum orçamento encontrado" : "Nenhum orçamento vinculado"}
                </h3>
                <p className="text-white/60">
                  {userType === "cliente" 
                    ? "Você ainda não possui orçamentos registrados." 
                    : "Você ainda não foi vinculado a nenhum orçamento."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative bg-gradient-to-br from-[var(--primary-blue-dark)]/90 via-[var(--primary-blue-medium)]/85 to-[var(--primary-blue-light)]/80">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Voltar ao Início</span>
          <span className="sm:hidden">Voltar</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-effect rounded-2xl p-6 sm:p-8 shadow-2xl sm:px-8 sm:py-8">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-20 h-20 mx-auto mb-3 relative sm:mb-0 py-0 text-lg sm:h-40 sm:w-60">
              <Image src="/LOGO.png" alt="Design Vidraçaria" fill className="object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-4">Área do Cliente/Arquiteto</h1>
            <p className="text-sm sm:text-base text-white/80 mt-2">
              Faça login para acessar sua conta
            </p>
          </div>

          {/* Message display */}
          {message && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-white">
              <AlertCircle size={16} />
              <span className="text-sm">{message}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                E-mail
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 z-10" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-[var(--primary-blue-dark)] border border-[var(--primary-blue-dark)] rounded-xl text-white placeholder-[#396496] focus:outline-none focus:ring-2 focus:ring-[#4c93e3] focus:border-[#4c93e3] transition-all duration-300 text-sm sm:text-base"
                  placeholder="Digite seu e-mail"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 z-10" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-[var(--primary-blue-dark)] border border-[var(--primary-blue-dark)] rounded-xl text-white placeholder-[#396496] focus:outline-none focus:ring-2 focus:ring-[#4c93e3] focus:border-[#4c93e3] transition-all duration-300 text-sm sm:text-base"
                  placeholder="Digite sua senha"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-300 z-10"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[var(--secondary-blue)] to-[var(--primary-blue-medium)] text-white font-bold py-2.5 sm:py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 shimmer-effect relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        {/* Copyright */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-white/60 text-xs sm:text-sm">© 2025 Design Vidraçaria. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
