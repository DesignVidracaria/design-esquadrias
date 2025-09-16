"use client"

import { useState, useEffect } from "react"
import { supabase, type Atendimento, type Profile } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock,
  MessageSquare,
  Users,
  Calendar,
  ChevronDown,
  FileText,
  Download,
  Copy,
  Paperclip,
  FileCheck2,
  File,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Atendente {
  id: string
  nome: string
  telefone: string
  created_at: string
}

export default function DashboardPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    concluidos: 0,
    hoje: 0,
  })

  const { toast } = useToast()
  const router = useRouter()

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: `${fieldName} copiado para a área de transferência`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive",
      })
    }
  }

  const toggleCardExpansion = (atendimentoId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(atendimentoId)) {
        newSet.delete(atendimentoId)
      } else {
        newSet.add(atendimentoId)
      }
      return newSet
    })
  }

  const renderUploadedFiles = (arquivos: any) => {
    if (!arquivos || (Array.isArray(arquivos) && arquivos.length === 0)) {
      return (
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
          <h4 className="text-white font-black mb-2 text-sm sm:text-base lg:text-lg flex items-center gap-2">
            <FileText size={16} />
            Arquivos Anexados
          </h4>
          <p className="text-white/60 text-sm">Nenhum arquivo anexado</p>
        </div>
      )
    }

    const files = Array.isArray(arquivos) ? arquivos : [arquivos]

    return (
      <div className="mt-4">
        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
          <Paperclip size={16} />
          Arquivos Anexados ({files.length})
        </h4>
        <div className="space-y-2">
          {files.map((arquivo: any, index: number) => (
            <div
              key={`arquivo-${index}`}
              className="flex items-center justify-between bg-white/10 rounded-lg p-2 sm:p-3"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File size={16} className="text-white/60 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm truncate">
                    {arquivo.nome_original || arquivo.name || `Arquivo ${index + 1}`}
                  </p>
                  {arquivo.tamanho_arquivo && (
                    <p className="text-white/60 text-xs">{(arquivo.tamanho_arquivo / 1024).toFixed(1)} KB</p>
                  )}
                </div>
              </div>
              {arquivo.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(arquivo.url, "_blank")}
                  className="text-white hover:bg-white/20 flex-shrink-0"
                >
                  <Download size={16} />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const sortAtendimentos = (atendimentos: Atendimento[]) => {
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    const currentTime = now.getHours() * 60 + now.getMinutes()

    return [...atendimentos].sort((a, b) => {
      // Prioridade 1: Pendentes
      const aIsPriority = a.status === "pendente"
      const bIsPriority = b.status === "pendente"

      if (aIsPriority && !bIsPriority) return -1
      if (!aIsPriority && bIsPriority) return 1

      // Dentro dos prioritários, ordenar por agendamento urgente
      if (aIsPriority && bIsPriority) {
        const aHasSchedule = a.data_agendamento === today && a.hora_agendamento
        const bHasSchedule = b.data_agendamento === today && b.hora_agendamento

        if (aHasSchedule && bHasSchedule) {
          const aTime =
            Number.parseInt(a.hora_agendamento!.split(":")[0]) * 60 + Number.parseInt(a.hora_agendamento!.split(":")[1])
          const bTime =
            Number.parseInt(b.hora_agendamento!.split(":")[0]) * 60 + Number.parseInt(b.hora_agendamento!.split(":")[1])

          const aUrgent = aTime <= currentTime + 30
          const bUrgent = bTime <= currentTime + 30

          if (aUrgent && !bUrgent) return -1
          if (!aUrgent && bUrgent) return 1

          return aTime - bTime
        }

        if (aHasSchedule && !bHasSchedule) return -1
        if (!aHasSchedule && bHasSchedule) return 1

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }

      // Prioridade 2: Concluídos e Cancelados
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError || !session) {
          router.push("/acesso")
          return
        }

        // Verifica o tipo de usuário na tabela profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("tipo_usuario")
          .eq("id", session.user.id)
          .single()

        // Se não encontrou na tabela profiles, verifica se é cliente ou arquiteto
        if (profileError || !profileData) {
          const { data: clienteData } = await supabase.from("clientes").select("id").eq("id", session.user.id).single()

          const { data: arquitetoData } = await supabase
            .from("arquitetos")
            .select("id")
            .eq("id", session.user.id)
            .single()

          if (clienteData || arquitetoData) {
            // É cliente ou arquiteto, redireciona para /profile
            router.push("/profile")
            return
          } else {
            // Não encontrou em nenhuma tabela, nega acesso
            router.push("/acesso?message=" + encodeURIComponent("Acesso negado. Usuário não encontrado."))
            return
          }
        }

        // Se encontrou na tabela profiles, verifica se é admin ou vendedor
        if (profileData.tipo_usuario !== "administrador" && profileData.tipo_usuario !== "vendedor") {
          router.push(
            "/acesso?message=" + encodeURIComponent("Acesso negado. Você não tem permissão para acessar esta página."),
          )
          return
        }

        const todayStr = new Date().toISOString().split("T")[0]

        const [profileResult, atendimentosResult, statsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, nome, email, nickname, tipo_usuario, ativo")
            .eq("id", session.user.id)
            .single(),
          supabase
            .from("atendimentos")
            .select("*")
            .or(`data_agendamento.eq.${todayStr},status.eq.concluido,status.eq.cancelado`)
            .order("created_at", { ascending: false }),
          supabase.from("atendimentos_stats").select("*").single(),
        ])

        if (profileResult && !profileResult.error) {
          setUserProfile(profileResult.data)
        } else {
          console.error("Erro ao carregar perfil:", profileResult?.error)
        }

        if (atendimentosResult && !atendimentosResult.error) {
          setAtendimentos(sortAtendimentos(atendimentosResult.data || []))
          const atendimentosDeHoje = atendimentosResult.data?.filter((a) => a.data_agendamento === todayStr).length || 0

          if (statsResult && !statsResult.error) {
            setStats({
              total: Number(statsResult.data.total_atendimentos) || 0,
              pendentes: Number(statsResult.data.pendentes) || 0,
              concluidos: Number(statsResult.data.concluidos) || 0,
              hoje: atendimentosDeHoje,
            })
          } else {
            const { data: allAtendimentos } = await supabase.from("atendimentos").select("*")
            if (allAtendimentos) {
              setStats({
                total: allAtendimentos.length,
                pendentes: allAtendimentos.filter((a) => a.status === "pendente").length,
                concluidos: allAtendimentos.filter((a) => a.status === "concluido").length,
                hoje: atendimentosDeHoje,
              })
            }
          }
        } else {
          console.error("Erro ao carregar atendimentos:", atendimentosResult?.error)
        }
      } catch (error) {
        console.error("Erro inesperado ao carregar dados:", error)
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro inesperado ao carregar a página. Tente novamente.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router, toast])

  const handleStatusChange = async (atendimentoId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("atendimentos").update({ status: newStatus }).eq("id", atendimentoId)

      if (error) throw error

      setAtendimentos((prev) => {
        const updatedList = prev.map((atendimento) =>
          atendimento.id === atendimentoId ? { ...atendimento, status: newStatus as any } : atendimento,
        )
        return sortAtendimentos(updatedList)
      })
      toast({
        title: "Sucesso!",
        description: "Status do atendimento atualizado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do atendimento",
        variant: "destructive",
      })
    }
  }

  const getDisplayName = () => {
    if (userProfile?.nome) return userProfile.nome
    if (userProfile?.nickname) return userProfile.nickname
    return "Usuário"
  }

  const getUserType = () => {
    if (userProfile?.tipo_usuario === "administrador") return "Administrador"
    return "Vendedor"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-600 text-white border-yellow-600"
      case "cancelado":
        return "bg-red-600 text-white border-red-600"
      case "concluido":
        return "bg-green-400 text-white border-green-400"
      default:
        return "bg-gray-600 text-white border-gray-600"
    }
  }

  const getStatusCardColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-[var(--primary-blue-dark)] border-[var(--primary-blue-dark)]/50 text-white"
      case "concluido":
        return "bg-green-600 border-green-500 text-white"
      case "cancelado":
        return "bg-red-600 border-red-500 text-white"
      default:
        return "bg-[var(--primary-blue-dark)] border-[var(--primary-blue-dark)]/50 text-white"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente"
      case "cancelado":
        return "Cancelado"
      case "concluido":
        return "Concluído"
      default:
        return status
    }
  }

  const isUrgent = (atendimento: Atendimento) => {
    if (atendimento.status !== "pendente") return false

    if (!atendimento.data_agendamento || !atendimento.hora_agendamento) return false

    const now = new Date()
    const today = now.toISOString().split("T")[0]

    if (atendimento.data_agendamento !== today) return false

    const currentTime = now.getHours() * 60 + now.getMinutes()
    const scheduledTime =
      Number.parseInt(atendimento.hora_agendamento.split(":")[0]) * 60 +
      Number.parseInt(atendimento.hora_agendamento.split(":")[1])

    return scheduledTime <= currentTime + 30
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="pt-6 sm:pt-8">
          <div className="glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 bg-white/20 rounded mb-2"></div>
              <div className="h-3 sm:h-4 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const atendimentosDeHoje = atendimentos.filter(
    (a) =>
      a.data_agendamento === new Date().toISOString().split("T")[0] &&
      a.status !== "concluido" &&
      a.status !== "cancelado",
  )
  const atendimentosFinalizadosHoje = atendimentos.filter((a) => {
    const hoje = new Date().toISOString().split("T")[0]
    const dataAtendimento = a.created_at ? new Date(a.created_at).toISOString().split("T")[0] : null
    return (a.status === "concluido" || a.status === "cancelado") && dataAtendimento === hoje
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="pt-6 sm:pt-8">
        <div className="bg-slate-800/90 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-200 font-semibold">
            Bem-vindo ao painel de controle da Design Vidraçaria, {getDisplayName()} ({getUserType()})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="glass-effect border-white/20">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--primary-blue-dark)] font-semibold text-xs sm:text-sm">
                  Total de Atendimentos
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--primary-blue-dark)]">
                  {stats.total}
                </p>
              </div>
              <Users className="text-[var(--primary-blue-dark)]" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--primary-blue-dark)] font-semibold text-xs sm:text-sm">Pendentes</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-400">{stats.pendentes}</p>
              </div>
              <Clock className="text-blue-400" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--primary-blue-dark)] font-semibold text-xs sm:text-sm">Concluídos</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-400">{stats.concluidos}</p>
              </div>
              <FileCheck2 className="text-green-400" size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/20">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--primary-blue-dark)] font-semibold text-xs sm:text-sm">Hoje</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">{stats.hoje}</p>
              </div>
              <Calendar className="text-[var(--gold-accent)]" size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Atendimentos Pendentes</h2>
          <Link href="/historico">
            <Button
              variant="ghost"
              className="text-[var(--primary-blue-dark)] border-[var(--primary-blue-dark)] hover:bg-[var(--primary-blue-dark)] hover:text-white border-0 shadow-md text-white bg-slate-900"
            >
              VER TODOS ATENDIMENTOS
            </Button>
          </Link>
        </div>

        {atendimentosDeHoje && atendimentosDeHoje.length > 0 ? (
          atendimentosDeHoje.map((atendimento) => {
            const isExpanded = expandedCards.has(atendimento.id)
            const urgent = isUrgent(atendimento)
            const cardColor = getStatusCardColor(atendimento.status)
            const cardHoverClass = "hover:bg-[var(--primary-blue-dark)]/90 hover:shadow-2xl hover:scale-[1.02]"

            return (
              <Card
                key={atendimento.id}
                className={`${cardColor} shadow-xl border-white/20 ${cardHoverClass} transition-all duration-300 cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCardExpansion(atendimento.id)
                }}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <CardTitle className="text-lg sm:text-xl font-black text-white break-words">
                          <span
                            className={`inline-flex items-center justify-center ${
                              urgent ? "bg-red-800" : "bg-blue-600"
                            } text-white text-sm font-bold px-3 py-1 rounded-full mr-3 min-w-[2.5rem] h-8`}
                          >
                            {atendimento.num_order ?? atendimento.id}
                          </span>
                          <span className="sm:hidden text-base">{atendimento.nome}</span>
                          <span className="hidden sm:inline">{atendimento.nome}</span>
                          {urgent && (
                            <span className="ml-2 inline-flex items-center gap-1 bg-red-800 text-white text-xs px-2 py-1 rounded-full">
                              <Clock size={12} />
                              URGENTE
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-white/80 text-xs sm:text-sm">
                          <Clock size={14} />
                          <span>
                            {formatDistanceToNow(new Date(atendimento.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                          {atendimento.hora_agendamento && (
                            <span className="ml-2 font-bold">📅 {atendimento.hora_agendamento}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <Select onValueChange={(value) => handleStatusChange(atendimento.id, value)}>
                        <SelectTrigger className="w-[120px] bg-transparent border-none text-white hover:bg-white/10 text-xs h-8">
                          <SelectValue>{getStatusLabel(atendimento.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--primary-blue-dark)] border-white/20">
                          <SelectItem
                            value="pendente"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🟡 Pendente
                          </SelectItem>
                          <SelectItem
                            value="cancelado"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🔴 Cancelado
                          </SelectItem>
                          <SelectItem
                            value="concluido"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            ✅ Concluído
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCardExpansion(atendimento.id)
                        }}
                        className="h-6 w-6 text-white hover:bg-white/10 transition-transform duration-200"
                        title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                    <div className="sm:hidden flex items-center gap-2">
                      <Select onValueChange={(value) => handleStatusChange(atendimento.id, value)}>
                        <SelectTrigger className="w-[120px] bg-transparent border-none text-white hover:bg-white/10 text-xs h-8">
                          <SelectValue>{getStatusLabel(atendimento.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--primary-blue-dark)] border-white/20">
                          <SelectItem
                            value="pendente"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🟡 Pendente
                          </SelectItem>
                          <SelectItem
                            value="cancelado"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🔴 Cancelado
                          </SelectItem>
                          <SelectItem
                            value="concluido"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            ✅ Concluído
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCardExpansion(atendimento.id)
                        }}
                        className="h-6 w-6 text-white hover:bg-white/10 transition-transform duration-200"
                        title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 border-t border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(atendimento.telefone, "Telefone")
                            }}
                            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            title="Copiar telefone"
                          >
                            <Copy size={12} />
                          </Button>
                          <span className="font-black text-white text-sm sm:text-base lg:text-lg">Telefone:</span>
                          <span className="text-white text-sm sm:text-base lg:text-lg break-all">
                            {atendimento.telefone}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(atendimento.cidade, "Cidade")
                            }}
                            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            title="Copiar cidade"
                          >
                            <Copy size={12} />
                          </Button>
                          <span className="font-black text-white text-sm sm:text-base lg:text-lg">Cidade:</span>
                          <span className="text-white text-sm sm:text-base lg:text-lg break-words">
                            {atendimento.cidade}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-black mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg">
                          👤 Nome Completo
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(atendimento.nome, "Nome completo")
                          }}
                          className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                          title="Copiar nome completo"
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                      <p className="text-white/80 text-sm sm:text-base">{atendimento.nome}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-black mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg">
                          <MessageSquare size={16} className="inline mr-2" />
                          Mensagem
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(atendimento.mensagem, "Mensagem")
                          }}
                          className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                          title="Copiar mensagem"
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                      <p className="text-white/80 text-sm sm:text-base whitespace-pre-wrap">{atendimento.mensagem}</p>
                    </div>

                    {renderUploadedFiles(atendimento.arquivos)}
                  </CardContent>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="bg-slate-800/90 border-white/30">
            <CardContent className="p-6 text-center">
              <p className="text-slate-200">Nenhum atendimento agendado para hoje.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800">Atendimentos Finalizados do Dia</h2>
        {atendimentosFinalizadosHoje && atendimentosFinalizadosHoje.length > 0 ? (
          atendimentosFinalizadosHoje.map((atendimento) => {
            const isExpanded = expandedCards.has(atendimento.id)
            const cardColor = getStatusCardColor(atendimento.status)

            return (
              <Card
                key={atendimento.id}
                className={`${cardColor} shadow-xl border-white/20 hover:opacity-90 transition-all duration-300 cursor-pointer`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCardExpansion(atendimento.id)
                }}
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <CardTitle className="text-lg sm:text-xl font-black text-white break-words">
                          <span
                            className={`inline-flex items-center justify-center ${
                              atendimento.status === "concluido" ? "bg-green-800" : "bg-red-800"
                            } text-white text-sm font-bold px-3 py-1 rounded-full mr-3 min-w-[2.5rem] h-8`}
                          >
                            {atendimento.num_order ?? atendimento.id}
                          </span>
                          <span className="sm:hidden text-base">{atendimento.nome}</span>
                          <span className="hidden sm:inline">{atendimento.nome}</span>
                        </CardTitle>
                        <div className="flex items-center gap-1 text-white/80 text-xs sm:text-sm">
                          <Clock size={14} />
                          <span>
                            {formatDistanceToNow(new Date(atendimento.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <Select onValueChange={(value) => handleStatusChange(atendimento.id, value)}>
                        <SelectTrigger className="w-[120px] bg-transparent border-none text-white hover:bg-white/10 text-xs h-8">
                          <SelectValue>{getStatusLabel(atendimento.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--primary-blue-dark)] border-white/20">
                          <SelectItem
                            value="pendente"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🟡 Pendente
                          </SelectItem>
                          <SelectItem
                            value="cancelado"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🔴 Cancelado
                          </SelectItem>
                          <SelectItem
                            value="concluido"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            ✅ Concluído
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCardExpansion(atendimento.id)
                        }}
                        className="h-6 w-6 text-white hover:bg-white/10 transition-transform duration-200"
                        title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                    <div className="sm:hidden flex items-center gap-2">
                      <Select onValueChange={(value) => handleStatusChange(atendimento.id, value)}>
                        <SelectTrigger className="w-[120px] bg-transparent border-none text-white hover:bg-white/10 text-xs h-8">
                          <SelectValue>{getStatusLabel(atendimento.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--primary-blue-dark)] border-white/20">
                          <SelectItem
                            value="pendente"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🟡 Pendente
                          </SelectItem>
                          <SelectItem
                            value="cancelado"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            🔴 Cancelado
                          </SelectItem>
                          <SelectItem
                            value="concluido"
                            className="text-white hover:bg-[var(--secondary-blue)] focus:bg-[var(--secondary-blue)]"
                          >
                            ✅ Concluído
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCardExpansion(atendimento.id)
                        }}
                        className="h-6 w-6 text-white hover:bg-white/10 transition-transform duration-200"
                        title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 border-t border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(atendimento.telefone, "Telefone")
                            }}
                            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            title="Copiar telefone"
                          >
                            <Copy size={12} />
                          </Button>
                          <span className="font-black text-white text-sm sm:text-base lg:text-lg">Telefone:</span>
                          <span className="text-white text-sm sm:text-base lg:text-lg break-all">
                            {atendimento.telefone}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(atendimento.cidade, "Cidade")
                            }}
                            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            title="Copiar cidade"
                          >
                            <Copy size={12} />
                          </Button>
                          <span className="font-black text-white text-sm sm:text-base lg:text-lg">Cidade:</span>
                          <span className="text-white text-sm sm:text-base lg:text-lg break-words">
                            {atendimento.cidade}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-black mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg">
                          👤 Nome Completo
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(atendimento.nome, "Nome completo")
                          }}
                          className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                          title="Copiar nome completo"
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                      <p className="text-white/80 text-sm sm:text-base">{atendimento.nome}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-black mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg">
                          <MessageSquare size={16} className="inline mr-2" />
                          Mensagem
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(atendimento.mensagem, "Mensagem")
                          }}
                          className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                          title="Copiar mensagem"
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                      <p className="text-white/80 text-sm sm:text-base whitespace-pre-wrap">{atendimento.mensagem}</p>
                    </div>

                    {renderUploadedFiles(atendimento.arquivos)}
                  </CardContent>
                )}
              </Card>
            )
          })
        ) : (
          <Card className="bg-slate-800/90 border-white/30">
            <CardContent className="p-6 text-center">
              <p className="text-slate-200">Nenhum atendimento finalizado hoje.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
