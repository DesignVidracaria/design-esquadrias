"use client"

import { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User, MessageCircle, Wrench, Building2, LogOut, Settings, Award, Calendar, MapPin, Phone, Mail, TrendingUp, Plus, X, AlertCircle,
  Pencil,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import Chat from "@/components/Chat"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from "next/image"

// Interfaces
interface Obra {
  id: string;
  titulo: string;
  cliente: string;
  endereco: string;
  status: string;
  data_inicio: string;
  arquiteto_nome?: string;
  vendedor_nome: string;
  valor_total?: number;
  data_previsao?: string;
}

interface SolicitacaoManutencao {
  id: string;
  tipo_servico: string;
  descricao_problema: string;
  status: string;
  created_at: string;
  urgencia: string;
}

interface ProfileData {
  id: string;
  uid: string;
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  desconto_atual?: number;
}

// Componente do Modal de Solicitação de Andamento
function SolicitacaoModal({ isOpen, onClose, userProfile, userType }) {
  if (!isOpen) return null

  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState(userProfile?.nome || "")
  const [tipoUsuario, setTipoUsuario] = useState(userType)
  const [numeroOrcamento, setNumeroOrcamento] = useState("")

  const { toast } = useToast()

  const handleSolicitar = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!nome.trim() || !numeroOrcamento.trim()) {
      toast({
        title: "⚠️ Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("solicitacoes_andamento")
        .insert({
          nome,
          tipo_usuario: tipoUsuario,
          numero_orcamento: numeroOrcamento,
          perfil_id: userProfile.id,
        })
        .select()

      if (error) throw error

      toast({
        title: "✅ Sucesso",
        description: "Sua solicitação foi enviada e está pendente de aprovação!",
      })
      onClose()
      setNome(userProfile?.nome || "")
      setTipoUsuario(userType)
      setNumeroOrcamento("")
    } catch (error: any) {
      console.error("Erro ao solicitar andamento:", error)
      toast({
        title: "❌ Erro",
        description: `Erro ao enviar solicitação: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white text-[#0077B6] border-[#0077B6]/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-[#0077B6]">
              <Pencil className="w-5 h-5 text-[#0077B6]" />
              Solicitar Andamento de Obra
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-[#0077B6]/70 hover:text-[#0077B6] hover:bg-[#0077B6]/10">
              <X className="w-5 h-5 text-[#0077B6]" />
            </Button>
          </div>
          <CardDescription className="text-[#0077B6]">Preencha o formulário para solicitar o andamento de uma obra.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSolicitar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[#0077B6]">
                Nome
              </Label>
              <Input
                id="nome"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-blue-50 border-[#0077B6]/20 text-[#0077B6]"
                placeholder="Nome Completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoUsuario" className="text-[#0077B6]">
                Tipo de Usuário
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={tipoUsuario === "cliente" ? "default" : "outline"}
                  onClick={() => setTipoUsuario("cliente")}
                  className={`flex-1 ${tipoUsuario === "cliente" ? "bg-[#0077B6] text-white" : "bg-transparent border-[#0077B6]/20 text-[#0077B6] hover:bg-[#0077B6]/10"}`}
                >
                  <User size={16} className="mr-2 text-white" />
                  Cliente
                </Button>
                <Button
                  type="button"
                  variant={tipoUsuario === "arquiteto" ? "default" : "outline"}
                  onClick={() => setTipoUsuario("arquiteto")}
                  className={`flex-1 ${tipoUsuario === "arquiteto" ? "bg-[#0077B6] text-white" : "bg-transparent border-[#0077B6]/20 text-[#0077B6] hover:bg-[#0077B6]/10"}`}
                >
                  <Building2 size={16} className="mr-2 text-white" />
                  Arquiteto
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroOrcamento" className="text-[#0077B6]">
                Número do Orçamento
              </Label>
              <Input
                id="numeroOrcamento"
                name="numeroOrcamento"
                value={numeroOrcamento}
                onChange={(e) => setNumeroOrcamento(e.target.value)}
                className="bg-blue-50 border-[#0077B6]/20 text-[#0077B6]"
                placeholder="Número do Orçamento"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-[#0077B6]/20 text-[#0077B6] hover:bg-[#0077B6]/10">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#0077B6] hover:bg-[#0077B6]/90 text-white">
                {loading ? "Solicitando..." : "SOLICITAR"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente do Modal de Configurações
function SettingsModal({ isOpen, onClose, user, userType, profileData }) {
  if (!isOpen) return null

  const [formData, setFormData] = useState({
    nome: profileData?.nome || "",
    telefone: profileData?.telefone || "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !userType || !profileData?.id) return
    setLoading(true)
    setMessage(null)

    const table = userType === "cliente" ? "clientes" : "arquitetos"
    const { error } = await supabase.from(table).update({ nome: formData.nome, telefone: formData.telefone }).eq("id", profileData.id)

    setLoading(false)
    if (error) {
      setMessage({ type: "error", text: "Erro ao atualizar perfil. Tente novamente." })
      console.error("Update error:", error)
    } else {
      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" })
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1500)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white text-[#0077B6] border-[#0077B6]/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-[#0077B6]">
              <Settings className="w-5 h-5 text-[#0077B6]" />
              Configurações da Conta
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-[#0077B6]/70 hover:text-[#0077B6] hover:bg-[#0077B6]/10">
              <X className="w-5 h-5 text-[#0077B6]" />
            </Button>
          </div>
          <CardDescription className="text-[#0077B6]">Atualize suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-[#0077B6]">
                Nome Completo
              </Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} className="bg-blue-50 border-blue-200 text-[#0077B6]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#0077B6]">
                Email (não pode ser alterado)
              </Label>
              <Input id="email" name="email" value={user?.email || ""} disabled className="bg-blue-100 border-blue-200 text-[#0077B6]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-[#0077B6]">
                Telefone
              </Label>
              <Input id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} className="bg-blue-50 border-blue-200 text-[#0077B6]" />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === "success" ? "bg-green-500/20 text-[#0077B6]" : "bg-red-500/20 text-[#0077B6]"}`}>
                <AlertCircle size={16} className="text-[#0077B6]" /> {message.text}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-[#0077B6]/20 text-[#0077B6] hover:bg-[#0077B6]/10">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#0077B6] hover:bg-[#0077B6]/90 text-white">
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userType, setUserType] = useState<"cliente" | "arquiteto" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [obras, setObras] = useState<Obra[]>([])
  const [loadingObras, setLoadingObras] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoManutencao[]>([])
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [solicitacaoAndamentoOpen, setSolicitacaoAndamentoOpen] = useState(false)

  const fetchObras = async (profileId: string, type: "cliente" | "arquiteto") => {
    setLoadingObras(true)
    try {
      const column = type === "cliente" ? "cliente_id" : "arquiteto_id"
      const { data, error } = await supabase.from("obras").select("*").eq(column, profileId).order("created_at", { ascending: false })

      if (error) throw error
      setObras(data || [])
    } catch (error) {
      console.error("Erro ao buscar obras:", error)
    } finally {
      setLoadingObras(false)
    }
  }

  const fetchSolicitacoes = async (clienteId: string) => {
    setLoadingSolicitacoes(true)
    try {
      const { data, error } = await supabase.from("solicitacoes_manutencao").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false })
      if (error) throw error
      setSolicitacoes(data || [])
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error)
    } finally {
      setLoadingSolicitacoes(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/acesso");
        return;
      }

      let profile = null;
      let type: "cliente" | "arquiteto" | null = null;

      try {
        const { data: clienteProfile } = await supabase.from('clientes').select('*').eq('id', user.id).single();
        if (clienteProfile) {
          profile = clienteProfile;
          type = 'cliente';
          await fetchObras(clienteProfile.id, 'cliente');
          await fetchSolicitacoes(clienteProfile.id);
        } else {
          const { data: arquitetoProfile } = await supabase.from('arquitetos').select('*').eq('id', user.id).single();
          if (arquitetoProfile) {
            profile = arquitetoProfile;
            type = 'arquiteto';
            await fetchObras(arquitetoProfile.id, 'arquiteto');
            setLoadingSolicitacoes(false);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setProfileData(profile);
        setUserType(type);
        setIsLoading(false);
      }
    };

    fetchData();

  }, [router]);


  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "em_andamento": return "bg-[#0077B6]";
      case "concluido": return "bg-[#0077B6]";
      case "pendente": return "bg-[#0077B6]";
      case "cancelado": return "bg-[#0077B6]";
      default: return "bg-[#0077B6]";
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "em_andamento": return "Em Andamento";
      case "concluido": return "Concluído";
      case "pendente": return "Pendente";
      case "cancelado": return "Cancelado";
      default: return status;
    }
  }

  const calculateDiscountProgress = () => {
    if (userType !== 'arquiteto') return 0
    const maxDiscount = 20
    const discountPerProject = 1.2
    const currentDiscount = Math.min(obras.length * discountPerProject, maxDiscount)
    return (currentDiscount / maxDiscount) * 100
  }

  const getManutencaoStatusColor = (status: string) => {
    switch (status) {
      case "pendente": return "bg-[#0077B6]";
      case "em_andamento": return "bg-[#0077B6]";
      case "concluido": return "bg-[#0077B6]";
      default: return "bg-[#0077B6]";
    }
  }

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia.toLowerCase()) {
      case "baixa": return "bg-[#0077B6]/20 text-[#0077B6]";
      case "media": return "bg-[#0077B6]/20 text-[#0077B6]";
      case "alta": return "bg-[#0077B6]/20 text-[#0077B6]";
      default: return "bg-[#0077B6]/20 text-[#0077B6]";
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0077B6] via-[#005F9A] to-[#00477D] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white" />
        <p className="mt-4 text-white">Carregando perfil...</p>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0077B6] via-[#005F9A] to-[#00477D] flex flex-col items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-white" />
          <h1 className="mt-4 text-2xl font-bold text-white">Perfil não encontrado</h1>
          <p className="mt-2 text-white">Não foi possível carregar as informações do seu perfil. Por favor, tente novamente mais tarde.</p>
          <Button onClick={handleSignOut} className="mt-4 bg-[#0077B6] hover:bg-[#0077B6]/90 text-white">
            Sair e tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen p-4 md:p-8 flex flex-col items-center space-y-8">
      {/* Background with gradient and backdrop blur */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0077B6] via-[#005F9A] to-[#00477D]" />

      {/* Logo Centralizada no Topo */}
      <div className="relative z-10 w-full max-w-4xl flex justify-center py-4">
        <Image src="/logo.png" alt="Logo da Empresa" width={150} height={50} className="object-contain" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{profileData?.nome || "Usuário"}</h1>
              <p className="text-sm text-white/80">
                {userType === "cliente" ? "Cliente" : "Arquiteto"}
              </p>
            </div>
            </div>
            <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-white border-[#0077B6]/20">
          <CardHeader>
            <CardTitle className="text-[#0077B6] flex items-center gap-2">
              <User className="text-[#0077B6]" /> Meu Perfil
            </CardTitle>
            <CardDescription className="text-gray-600">
              Gerencie suas informações e acompanhe seus projetos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-[#0077B6]">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#0077B6]" />
                <span>{profileData?.nome || "Nome não disponível"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#0077B6]" />
                <span>{profileData?.email || user?.email}</span>
              </div>
              {profileData?.cidade && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#0077B6]" />
                  <span>{profileData?.cidade} - {profileData?.estado}</span>
                </div>
              )}
            </div>

            {userType === 'cliente' && (
              <div className="flex justify-center pt-4">
                <Button onClick={() => setSolicitacaoAndamentoOpen(true)} className="bg-[#0077B6] hover:bg-[#0077B6]/90 text-white font-semibold">
                  SOLICITAR ANDAMENTO DE OBRA
                </Button>
              </div>
            )}
            
            {userType === 'arquiteto' && (
              <div className="space-y-4 pt-4">
                <h3 className="flex items-center gap-2 font-medium text-[#0077B6]">
                  <Award className="w-5 h-5 text-[#0077B6]" />
                  Progresso do Desconto
                </h3>
                <div className="flex items-center gap-4">
                  <Progress value={calculateDiscountProgress()} className="flex-1 h-2 bg-gray-200 [&>div]:bg-[#0077B6]" />
                  <span className="text-sm text-[#0077B6]">{profileData?.desconto_atual || 0}% de desconto</span>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="obras" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/20 border-white/30">
            <TabsTrigger value="obras" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#0077B6] data-[state=active]:shadow-sm">
              <Wrench className="w-4 h-4 mr-2" />
              Todas as Obras
            </TabsTrigger>
            {userType === 'cliente' && (
              <TabsTrigger value="solicitacoes" className="text-white data-[state=active]:bg-white data-[state=active]:text-[#0077B6] data-[state=active]:shadow-sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Solicitações
              </TabsTrigger>
            )}
          </TabsList>

          {/* Obras Tab Content */}
          <TabsContent value="obras" className="p-4 space-y-4">
            <div className="grid gap-4">
              {loadingObras ? (
                <div className="text-center text-white">Carregando obras...</div>
              ) : obras.length > 0 ? (
                obras.map((obra) => (
                  <Card key={obra.id} className="bg-white border-[#0077B6]/20">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center text-lg text-[#0077B6]">
                        <span>{obra.titulo}</span>
                        <Badge className={`${getStatusColor(obra.status)} text-white`}>{getStatusText(obra.status)}</Badge>
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-sm">{obra.data_inicio} - {obra.data_previsao || "Não informada"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-[#0077B6]">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#0077B6]" />
                        <span className="font-semibold">{obra.cliente}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#0077B6]" />
                        <span className="font-semibold">{obra.endereco}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center text-white">Nenhuma obra encontrada.</div>
              )}
            </div>
          </TabsContent>

          {/* Solicitações Tab Content (only for clients) */}
          {userType === 'cliente' && (
            <TabsContent value="solicitacoes" className="p-4 space-y-4">
              <Card className="bg-white border-[#0077B6]/20">
                <CardHeader>
                  <CardTitle className="text-[#0077B6]">Minhas Solicitações</CardTitle>
                  <CardDescription className="text-gray-600">
                    Acompanhe o status das suas solicitações de manutenção.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSolicitacoes ? (
                    <div className="text-center text-white">Carregando solicitações...</div>
                  ) : solicitacoes.length === 0 ? (
                    <div className="text-center text-white">Nenhuma solicitação encontrada.</div>
                  ) : (
                    <div className="grid gap-4">
                      {solicitacoes.map((solicitacao) => (
                        <Card key={solicitacao.id} className="bg-white border-[#0077B6]/20">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-[#0077B6]">{solicitacao.tipo_servico}</span>
                              <Badge className={`${getManutencaoStatusColor(solicitacao.status)} text-white`}>
                                {getStatusText(solicitacao.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#0077B6]">{solicitacao.descricao_problema}</p>
                            <div className="flex justify-between items-center text-xs text-[#0077B6]">
                              <span>Data: {new Date(solicitacao.created_at).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded-full text-xs capitalize font-medium ${getUrgenciaColor(solicitacao.urgencia)}`}>{solicitacao.urgencia}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Chat Component */}
      <Chat isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Settings Modal */}
      {profileData && <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} userType={userType} profileData={profileData} />}

      {/* Solicitação Andamento Modal */}
      {profileData && <SolicitacaoModal isOpen={solicitacaoAndamentoOpen} onClose={() => setSolicitacaoAndamentoOpen(false)} userProfile={profileData} userType={userType} />}
    </div>
  )
}
