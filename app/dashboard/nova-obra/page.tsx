"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  User,
  MapPin,
  Upload,
  X,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  LinkIcon,
  Building2,
  Search,
  FileText,
  CheckCircle,
  Plus,
} from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Cliente {
  id: string
  nome: string
  email: string
  telefone?: string
}

interface Arquiteto {
  id: string
  nome: string
  email: string
  telefone?: string
  desconto_atual: number
}

export default function NovaObraPage() {
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [obras, setObras] = useState<any[]>([])
  const [loadingObras, setLoadingObras] = useState(true)
  const [editingObra, setEditingObra] = useState<any>(null)
  const [expandedCategories, setExpandedCategories] = useState({
    emAndamento: false,
    concluido: false,
  })

  const [numeroOrcamento, setNumeroOrcamento] = useState("")
  const [cliente, setCliente] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [arquitetoId, setArquitetoId] = useState("")
  const [instalador, setInstalador] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataPrevisao, setDataPrevisao] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [galeria, setGaleria] = useState<File[]>([])

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [arquitetos, setArquitetos] = useState<Arquiteto[]>([])
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false)
  const [arquitetoSearchOpen, setArquitetoSearchOpen] = useState(false)
  const [clienteSearch, setClienteSearch] = useState("")
  const [arquitetoSearch, setArquitetoSearch] = useState("")

  const [questions, setQuestions] = useState([
    { key: "material_entregue", text: "Material foi entregue no local?" },
    { key: "cliente_confirmou_medidas", text: "Cliente confirmou as medidas?" },
    { key: "local_preparado", text: "Local está preparado para instalação?" },
    { key: "ferramentas_disponiveis", text: "Ferramentas necessárias estão disponíveis?" },
    { key: "cliente_aprovou_projeto", text: "Cliente aprovou o projeto final?" },
    { key: "documentacao_completa", text: "Documentação está completa?" },
    { key: "prazo_confirmado", text: "Prazo de entrega foi confirmado?" },
  ])

  const [questionsAnswers, setQuestionsAnswers] = useState<{ [key: string]: { text: string; status: boolean } }>({})

  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editingQuestionText, setEditingQuestionText] = useState("")
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedQuestionKey, setSelectedQuestionKey] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState("")
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"success" | "error" | "link">("success")
  const [modalMessage, setModalMessage] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const fetchClientesEArquitetos = async () => {
    try {
      const [clientesResult, arquitetosResult] = await Promise.all([
        supabase.from("clientes").select("id, nome, email, telefone").eq("ativo", true).order("nome"),
        supabase.from("arquitetos").select("id, nome, email, telefone, desconto_atual").eq("ativo", true).order("nome"),
      ])

      if (clientesResult.data) setClientes(clientesResult.data)
      if (arquitetosResult.data) setArquitetos(arquitetosResult.data)
    } catch (error) {
      console.error("Erro ao buscar clientes e arquitetos:", error)
    }
  }

  const fetchObras = async () => {
    try {
      setLoadingObras(true)
      const { data, error } = await supabase.from("obras").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setObras(data || [])
    } catch (error) {
      console.error("Erro ao buscar obras:", error)
    } finally {
      setLoadingObras(false)
    }
  }

  useEffect(() => {
    fetchObras()
    fetchClientesEArquitetos()
  }, [])

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user?.id) return

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setUserProfile(profile)
          setInstalador(profile?.nickname || profile?.nome || "Usuário")
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error)
      }
    }

    fetchUserProfile()
  }, [])

  useEffect(() => {
    const fetchObras = async () => {
      try {
        setLoadingObras(true)
        const { data, error } = await supabase.from("obras").select("*").order("created_at", { ascending: false })

        if (error) throw error
        setObras(data || [])
      } catch (error) {
        console.error("Erro ao buscar obras:", error)
      } finally {
        setLoadingObras(false)
      }
    }

    fetchObras()
  }, [])

  const obrasEmAndamento = obras.filter((obra) => obra.status !== "Concluído")
  const obrasConcluidas = obras.filter((obra) => obra.status === "Concluído")

  const filteredObrasEmAndamento = obrasEmAndamento.filter((obra) => {
    const matchesSearch =
      obra.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || (obra.data_inicio && obra.data_inicio.includes(dateFilter))
    return matchesSearch && matchesDate
  })

  const filteredObrasConcluidas = obrasConcluidas.filter((obra) => {
    const matchesSearch =
      obra.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obra.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || (obra.data_inicio && obra.data_inicio.includes(dateFilter))
    return matchesSearch && matchesDate
  })

  const handleGaleriaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    const newFiles = files.filter((newFile) => {
      return !galeria.some((existingFile) => existingFile.name === newFile.name && newFile.size === newFile.size)
    })

    if (newFiles.length !== files.length) {
      toast({
        title: "⚠️ Arquivos duplicados",
        description: `${files.length - newFiles.length} arquivo(s) já foram adicionados e foram ignorados.`,
        variant: "destructive",
      })
    }

    if (newFiles.length > 0) {
      setGaleria((prev) => [...prev, ...newFiles])
      console.log("[v0] Added", newFiles.length, "new files to gallery")
    }
  }

  const removeGaleriaFile = (index: number) => {
    console.log("[v0] Removing file at index:", index, "from gallery of", galeria.length, "files")

    setGaleria((prev) => {
      const newGaleria = prev.filter((_, i) => i !== index)
      console.log("[v0] Gallery updated from", prev.length, "to", newGaleria.length, "files")
      return newGaleria
    })

    toast({
      title: "🗑️ Imagem removida",
      description: "A imagem foi removida da galeria.",
    })
  }

  const calculateChecklistPercentage = (checklistStatus: { [key: string]: { text: string; status: boolean } }) => {
    const totalItens = Object.keys(checklistStatus).length
    let itensFeitos = 0

    for (const key in checklistStatus) {
      if (checklistStatus[key].status === true) {
        itensFeitos++
      }
    }

    const porcentagem = (itensFeitos / totalItens) * 100
    console.log(porcentagem + "% feito")
    return porcentagem
  }

  const checklistStats = calculateChecklistPercentage(questionsAnswers)

  const setQuestionStatus = async (questionKey: string, newStatus: boolean) => {
    const updatedChecklistStatus = {
      ...questionsAnswers,
      [questionKey]: {
        ...questionsAnswers[questionKey],
        status: newStatus,
      },
    }

    setQuestionsAnswers(updatedChecklistStatus)
    setOpenDropdown(null)

    calculateChecklistPercentage(updatedChecklistStatus)

    if (editingObra) {
      try {
        const { error } = await supabase
          .from("obras")
          .update({
            checklist_status: updatedChecklistStatus,
            descricao: JSON.stringify(updatedChecklistStatus),
          })
          .eq("id", editingObra.id)

        if (error) throw error

        setEditingObra((prev) => ({
          ...prev,
          checklist_status: updatedChecklistStatus,
        }))

        setObras((prevObras) =>
          prevObras.map((obra) =>
            obra.id === editingObra.id ? { ...obra, checklist_status: updatedChecklistStatus } : obra,
          ),
        )
      } catch (error: any) {
        setQuestionsAnswers((prev) => ({
          ...prev,
          [questionKey]: {
            ...prev[questionKey],
            status: !newStatus,
          },
        }))
      }
    }
  }

  const toggleQuestion = async (questionKey: string) => {
    const currentStatus = questionsAnswers[questionKey]?.status || false
    await setQuestionStatus(questionKey, !currentStatus)
  }

  const toggleDropdown = (questionKey: string) => {
    setOpenDropdown((prev) => (prev === questionKey ? null : questionKey))
  }

  const handleEditObra = (obra: any) => {
    setEditingObra(obra)
    setNumeroOrcamento(obra.titulo || "")
    setCliente(obra.cliente || "")
    setClienteId(obra.cliente_id || "")
    setArquitetoId(obra.arquiteto_id || "")
    setInstalador(obra.endereco || "")
    setDataInicio(obra.data_inicio || "")
    setDataPrevisao(obra.data_previsao || "")
    setObservacoes(obra.observacoes || "")
    setGaleria(obra.galeria || [])

    if (obra.cliente_id) {
      const clienteEncontrado = clientes.find((c) => c.id === obra.cliente_id)
      if (clienteEncontrado) {
        setClienteSearch(clienteEncontrado.nome)
      }
    }

    if (obra.arquiteto_id) {
      const arquitetoEncontrado = arquitetos.find((a) => a.id === obra.arquiteto_id)
      if (arquitetoEncontrado) {
        setArquitetoSearch(arquitetoEncontrado.nome)
      }
    }

    const loadedChecklistStatus: { [key: string]: { text: string; status: boolean } } = {}

    if (obra.checklist_status && typeof obra.checklist_status === "object") {
      console.log(`[v0] Loading checklist status from database:`, obra.checklist_status)

      for (const key in obra.checklist_status) {
        const item = obra.checklist_status[key]
        if (typeof item === "object" && item.hasOwnProperty("text") && item.hasOwnProperty("status")) {
          loadedChecklistStatus[key] = {
            text: item.text,
            status: item.status === true || item.status === "true" || item.status === 1,
          }
        } else {
          const defaultTexts: { [key: string]: string } = {
            material_entregue: "Material foi entregue no local?",
            cliente_confirmou_medidas: "Cliente confirmou as medidas?",
            local_preparado: "Local está preparado para instalação?",
            ferramentas_disponiveis: "Ferramentas necessárias estão disponíveis?",
            cliente_aprovou_projeto: "Cliente aprovou o projeto final?",
            documentacao_completa: "Documentação está completa?",
            prazo_confirmado: "Prazo de entrega foi confirmado?",
          }
          loadedChecklistStatus[key] = {
            text: defaultTexts[key] || `Pergunta ${key}`,
            status: item === true || item === "true" || item === 1,
          }
        }
      }
    } else {
      loadedChecklistStatus.material_entregue = { text: "Material foi entregue no local?", status: false }
      loadedChecklistStatus.cliente_confirmou_medidas = { text: "Cliente confirmou as medidas?", status: false }
      loadedChecklistStatus.local_preparado = { text: "Local está preparado para instalação?", status: false }
      loadedChecklistStatus.ferramentas_disponiveis = {
        text: "Ferramentas necessárias estão disponíveis?",
        status: false,
      }
      loadedChecklistStatus.cliente_aprovou_projeto = { text: "Cliente aprovou o projeto final?", status: false }
      loadedChecklistStatus.documentacao_completa = { text: "Documentação está completa?", status: false }
      loadedChecklistStatus.prazo_confirmado = { text: "Cliente aprovou o projeto final?", status: false }
    }

    setQuestionsAnswers(loadedChecklistStatus)
    console.log(`[v0] Loaded ${Object.keys(loadedChecklistStatus).length} checklist items`)

    toast({
      title: "✏️ Modo de Edição Ativado",
      description: `Editando obra: ${obra.titulo} - ${obra.cliente}. O checklist foi carregado.`,
    })
  }

  const handleDeleteObra = async (obraId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta obra?")) return

    try {
      const { error } = await supabase.from("obras").delete().eq("id", obraId)

      if (error) throw error

      showMessage("Obra excluída com sucesso!", "success")

      const { data } = await supabase.from("obras").select("*").order("created_at", { ascending: false })
      setObras(data || [])
    } catch (error: any) {
      showMessage(`Erro ao excluir obra: ${error.message}`, "error")
    }
  }

  const handleGenerateLink = (obra: any) => {
    const link = `${window.location.origin}/obra/${obra.titulo}`
    setGeneratedLink(link)
    setModalMessage(`Link da obra "${obra.titulo}" foi gerado com sucesso!`)
    setModalType("link")
    setShowModal(true)
  }

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    })
  }

  const openLinkInNewTab = () => {
    window.open(generatedLink, "_blank")
  }

  const resetForm = () => {
    setNumeroOrcamento("")
    setCliente("")
    setClienteId("")
    setArquitetoId("")
    setInstalador("")
    setDataInicio("")
    setDataPrevisao("")
    setObservacoes("")
    setGaleria([])
    setQuestionsAnswers({})
    setEditingObra(null)
    setClienteSearch("")
    setArquitetoSearch("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!numeroOrcamento.trim() || !clienteId) {
      showMessage("Por favor, preencha todos os campos obrigatórios e selecione um cliente.", "error")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.id) {
        throw new Error("Usuário não autenticado")
      }

      const galeriaUrls = []
      for (const file of galeria) {
        const fileName = `${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage.from("obras").upload(fileName, file)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("obras").getPublicUrl(fileName)

        galeriaUrls.push(publicUrl)
      }

      const finalChecklistStatus = questionsAnswers

      console.log(`[v0] Saving checklist status:`, finalChecklistStatus)

      const obraData = {
        titulo: numeroOrcamento,
        cliente,
        cliente_id: clienteId,
        arquiteto_id: arquitetoId || null,
        endereco: instalador,
        data_inicio: dataInicio || null,
        data_previsao: dataPrevisao || null,
        observacoes,
        galeria: editingObra
          ? [...(editingObra.galeria || []), ...galeriaUrls].filter((url, index, self) => self.indexOf(url) === index)
          : galeriaUrls,
        descricao: JSON.stringify(finalChecklistStatus),
        checklist_status: finalChecklistStatus,
        status: editingObra?.status || "em_andamento",
        ...(editingObra ? {} : { user_id: user.id }),
        atendente: userProfile?.nickname || userProfile?.nome || "Usuário",
      }

      let error, data
      if (editingObra) {
        console.log(`[v0] Updating obra with ID: ${editingObra.id}`)
        const result = await supabase.from("obras").update(obraData).eq("id", editingObra.id).select("*")
        error = result.error
        data = result.data

        if (!error && (!data || data.length === 0)) {
          throw new Error("Nenhuma linha foi atualizada. Verifique se você tem permissão para editar esta obra.")
        }
      } else {
        console.log(`[v0] Creating new obra`)
        const result = await supabase.from("obras").insert(obraData).select()
        error = result.error
        data = result.data
      }

      if (error) {
        console.error("Erro ao registrar obra:", error)
        showMessage(`Erro ao ${editingObra ? "atualizar" : "registrar"} obra: ${error.message}`, "error")
      } else {
        if (arquitetoId && !editingObra) {
          const arquiteto = arquitetos.find((a) => a.id === arquitetoId)
          if (arquiteto) {
            const novoDesconto = Math.min(arquiteto.desconto_atual + 1.2, 20)
            await supabase.from("arquitetos").update({ desconto_atual: novoDesconto }).eq("id", arquitetoId)
          }
        }

        showMessage(
          editingObra
            ? `A obra "${numeroOrcamento}" foi atualizada com sucesso.`
            : `Nova obra "${numeroOrcamento}" registrada com sucesso para o cliente ${cliente}.`,
          "success",
        )

        resetForm()

        setTimeout(async () => {
          const { data } = await supabase.from("obras").select("*").order("created_at", { ascending: false })
          setObras(data || [])
        }, 500)
      }
    } catch (error: any) {
      console.error("Erro:", error)
      showMessage(`Erro: ${error.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: "emAndamento" | "concluido") => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const showMessage = (message: string, type: "success" | "error" | "link" = "success") => {
    setModalMessage(message)
    setModalType(type)
    setShowModal(true)
  }

  const editQuestion = async (questionKey: string, newText: string) => {
    if (!newText.trim()) {
      showMessage("O texto da pergunta não pode estar vazio.", "error")
      setEditingQuestion(null)
      return
    }

    const updatedChecklistStatus = {
      ...questionsAnswers,
      [questionKey]: {
        ...questionsAnswers[questionKey],
        text: newText.trim(),
      },
    }

    setQuestionsAnswers(updatedChecklistStatus)
    setEditingQuestion(null) // Clear editing state immediately for better UX

    if (editingObra) {
      try {
        const { error } = await supabase
          .from("obras")
          .update({
            checklist_status: updatedChecklistStatus,
            descricao: JSON.stringify(updatedChecklistStatus),
          })
          .eq("id", editingObra.id)

        if (error) throw error

        setEditingObra((prev) => ({
          ...prev,
          checklist_status: updatedChecklistStatus,
        }))

        toast({
          title: "✅ Pergunta atualizada!",
          description: `A pergunta foi modificada com sucesso.`,
        })
      } catch (error) {
        console.error("Erro ao atualizar pergunta:", error)
        setQuestionsAnswers(questionsAnswers)
        showMessage("Erro ao atualizar pergunta.", "error")
      }
    } else {
      toast({
        title: "📝 Pergunta modificada",
        description: `A pergunta será salva quando a obra for registrada.`,
      })

      // Automatically start editing the new question
      const newQuestionKey = `pergunta_${Date.now()}`
      const newQuestionText = "Nova pergunta"
      setEditingQuestion(newQuestionKey)
      setEditingText(newQuestionText)
    }
  }

  const deleteQuestion = async (questionKey: string) => {
    const updatedChecklistStatus = { ...questionsAnswers }
    delete updatedChecklistStatus[questionKey]

    setQuestionsAnswers(updatedChecklistStatus)

    if (editingObra) {
      try {
        const { error } = await supabase
          .from("obras")
          .update({
            checklist_status: updatedChecklistStatus,
            descricao: JSON.stringify(updatedChecklistStatus),
          })
          .eq("id", editingObra.id)

        if (error) throw error

        setEditingObra((prev) => ({
          ...prev,
          checklist_status: updatedChecklistStatus,
        }))

        showMessage("Pergunta excluída com sucesso!", "success")
      } catch (error) {
        console.error("Erro ao excluir pergunta:", error)
        showMessage("Erro ao excluir pergunta.", "error")
      }
    }
  }

  const addQuestion = async () => {
    const newQuestionKey = `pergunta_${Date.now()}`
    const newQuestionText = "Nova pergunta"

    const updatedChecklistStatus = {
      ...questionsAnswers,
      [newQuestionKey]: {
        text: newQuestionText,
        status: false,
      },
    }

    setQuestionsAnswers(updatedChecklistStatus)

    if (editingObra) {
      try {
        const { error } = await supabase
          .from("obras")
          .update({
            checklist_status: updatedChecklistStatus,
            descricao: JSON.stringify(updatedChecklistStatus),
          })
          .eq("id", editingObra.id)

        if (error) throw error

        setEditingObra((prev) => ({
          ...prev,
          checklist_status: updatedChecklistStatus,
        }))

        toast({
          title: "✅ Pergunta adicionada!",
          description: `Nova pergunta foi adicionada ao checklist.`,
        })

        // Automatically start editing the new question
        setEditingQuestion(newQuestionKey)
        setEditingText(newQuestionText)
      } catch (error) {
        console.error("Erro ao adicionar pergunta:", error)
        setQuestionsAnswers(questionsAnswers)
        showMessage("Erro ao adicionar pergunta.", "error")
      }
    } else {
      toast({
        title: "📝 Pergunta adicionada",
        description: `A pergunta será salva quando a obra for registrada.`,
      })

      // Automatically start editing the new question
      setEditingQuestion(newQuestionKey)
      setEditingText(newQuestionText)
    }
  }

  const openStatusModal = (questionKey: string) => {
    setSelectedQuestionKey(questionKey)
    setShowStatusModal(true)
  }

  const handleStatusSelection = async (newStatus: boolean) => {
    if (selectedQuestionKey) {
      await setQuestionStatus(selectedQuestionKey, newStatus)
    }
    setShowStatusModal(false)
    setSelectedQuestionKey(null)
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Nova Obra</h1>
          <p className="text-white/80 text-lg">Registre uma nova obra ou projeto da Design Vidraçaria</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <label className="block text-white font-semibold mb-3">
                  <Calendar className="inline mr-2" size={20} />
                  Número do Orçamento *
                </label>
                <input
                  type="text"
                  value={numeroOrcamento}
                  onChange={(e) => setNumeroOrcamento(e.target.value)}
                  placeholder="Digite o número do orçamento..."
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-[var(--secondary-blue)] focus:outline-none"
                  required
                />
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <label className="block text-white font-semibold mb-3">
                  <User className="inline mr-2" size={20} />
                  Cliente Registrado *
                </label>
                <Popover open={clienteSearchOpen} onOpenChange={setClienteSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clienteSearchOpen}
                      className="w-full justify-between bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {clienteId
                        ? clientes.find((cliente) => cliente.id === clienteId)?.nome
                        : "Selecione um cliente..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientes.map((cliente) => (
                            <CommandItem
                              key={cliente.id}
                              value={cliente.nome}
                              onSelect={() => {
                                setClienteId(cliente.id)
                                setCliente(cliente.nome)
                                setClienteSearchOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{cliente.nome}</span>
                                <span className="text-sm text-gray-500">{cliente.email}</span>
                                {cliente.telefone && <span className="text-sm text-gray-500">{cliente.telefone}</span>}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <label className="block text-white font-semibold mb-3">
                  <Building2 className="inline mr-2" size={20} />
                  Arquiteto (Opcional)
                </label>
                <Popover open={arquitetoSearchOpen} onOpenChange={setArquitetoSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={arquitetoSearchOpen}
                      className="w-full justify-between bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {arquitetoId
                        ? arquitetos.find((arquiteto) => arquiteto.id === arquitetoId)?.nome
                        : "Selecione um arquiteto..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar arquiteto..." />
                      <CommandList>
                        <CommandEmpty>Nenhum arquiteto encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setArquitetoId("")
                              setArquitetoSearchOpen(false)
                            }}
                          >
                            <span className="text-gray-500">Nenhum arquiteto</span>
                          </CommandItem>
                          {arquitetos.map((arquiteto) => (
                            <CommandItem
                              key={arquiteto.id}
                              value={arquiteto.nome}
                              onSelect={() => {
                                setArquitetoId(arquiteto.id)
                                setArquitetoSearchOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{arquiteto.nome}</span>
                                <span className="text-sm text-gray-500">{arquiteto.email}</span>
                                <span className="text-sm text-blue-600">
                                  Desconto atual: {arquiteto.desconto_atual.toFixed(1)}%
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <label className="block text-white font-semibold mb-3">
                  <MapPin className="inline mr-2" size={20} />
                  Instalador
                </label>
                <input
                  type="text"
                  value={instalador}
                  onChange={(e) => setInstalador(e.target.value)}
                  placeholder="Nome do instalador..."
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-[var(--secondary-blue)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">Data de Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[var(--secondary-blue)] focus:outline-none"
                  />
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">Previsão de Término</label>
                  <input
                    type="date"
                    value={dataPrevisao}
                    onChange={(e) => setDataPrevisao(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[var(--secondary-blue)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <label className="block text-white font-semibold mb-4">
                  <FileText className="inline mr-2" size={20} />
                  Checklist da Obra
                </label>
                <div className="space-y-4">
                  {Object.entries(questionsAnswers).map(([key, item]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20"
                    >
                      <div className="flex-1">
                        {editingQuestion === key ? (
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => {
                              if (editingText.trim() !== item.text) {
                                editQuestion(key, editingText)
                              } else {
                                setEditingQuestion(null)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                if (editingText.trim() !== item.text) {
                                  editQuestion(key, editingText)
                                } else {
                                  setEditingQuestion(null)
                                }
                              } else if (e.key === "Escape") {
                                e.preventDefault()
                                setEditingQuestion(null)
                                setEditingText(item.text) // Reset to original text
                              }
                            }}
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                            autoFocus
                            placeholder="Digite o texto da pergunta..."
                          />
                        ) : (
                          <span className="text-white font-medium">{item.text}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingQuestion && editingQuestion !== key) {
                              toast({
                                title: "⚠️ Atenção",
                                description: "Termine de editar a pergunta atual antes de editar outra.",
                                variant: "destructive",
                              })
                              return
                            }
                            setEditingQuestion(key)
                            setEditingText(item.text)
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors hover:bg-white/10 rounded"
                          title="Editar pergunta"
                          disabled={editingQuestion !== null && editingQuestion !== key}
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir a pergunta: "${item.text}"?`)) {
                              deleteQuestion(key)
                            }
                          }}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-white/10 rounded"
                          title="Excluir pergunta"
                          disabled={editingQuestion === key}
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openStatusModal(key)
                            }}
                            className={`ml-4 px-6 py-3 rounded-lg font-bold transition-all duration-300 flex items-center gap-2 min-w-[140px] justify-center ${
                              item.status
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 scale-105 border-2 border-green-400"
                                : "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30 border-2 border-yellow-400"
                            }`}
                          >
                            {item.status ? (
                              <>
                                <CheckCircle size={18} className="animate-pulse" />
                                <span className="font-bold">CONCLUÍDO</span>
                              </>
                            ) : (
                              <>
                                <Calendar size={18} />
                                <span className="font-bold">PENDENTE</span>
                              </>
                            )}
                            <ChevronDown size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* ADICIONAR PERGUNTA button */}
                  <div className="flex justify-center mt-6">
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 hover:scale-105"
                      disabled={editingQuestion !== null}
                    >
                      <Plus size={18} />
                      ADICIONAR PERGUNTA
                    </button>
                  </div>
                </div>

                {Object.keys(questionsAnswers).length > 0 && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between text-white/80 text-sm mb-2">
                      <span>Progresso do Checklist</span>
                      <span>
                        {Object.values(questionsAnswers).filter((item) => item.status).length}/
                        {Object.keys(questionsAnswers).length} (
                        {calculateChecklistPercentage(questionsAnswers).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${calculateChecklistPercentage(questionsAnswers)}%`,
                        }}
                      />
                    </div>
                    <div className="text-center text-white/60 text-xs mt-2">
                      {calculateChecklistPercentage(questionsAnswers).toFixed(2)}% feito
                    </div>
                  </div>
                )}
              </div>

              {editingObra && (
                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <button
                    type="button"
                    onClick={() => handleGenerateLink(editingObra)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <LinkIcon size={20} />
                    Gerar Link da Obra
                  </button>
                </div>
              )}

              <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <label className="block text-white font-semibold mb-3">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-[var(--secondary-blue)] focus:outline-none resize-vertical"
                />
              </div>

              <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <label className="block text-white font-semibold mb-3">
                  <Upload className="inline mr-2" size={20} />
                  Galeria de Imagens (Opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGaleriaUpload}
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--secondary-blue)] file:text-white hover:file:bg-[var(--primary-blue-dark)]"
                />

                {galeria.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galeria.map((imagem, index) => {
                      let imageUrl = "/placeholder.svg"
                      try {
                        if (imagem && imagem instanceof File && imagem.size > 0) {
                          imageUrl = URL.createObjectURL(imagem)
                        }
                      } catch (error) {
                        console.error("[v0] Error creating object URL:", error)
                        imageUrl = "/placeholder.svg"
                      }

                      return (
                        <div key={`${imagem.name}-${index}`} className="relative group">
                          <img
                            src={imageUrl || "/placeholder.svg"}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log("[v0] Remove button clicked for index:", index)
                              removeGaleriaFile(index)
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg group-hover:opacity-100 opacity-80"
                            title={`Remover ${imagem?.name || "imagem"}`}
                          >
                            <X size={14} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b-lg truncate">
                            {imagem?.name || "Unknown file"}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--secondary-blue)] hover:bg-[var(--secondary-blue)]/90 text-white font-semibold py-4 text-lg"
              >
                {loading ? "Processando..." : editingObra ? "Atualizar Obra" : "Registrar Obra"}
              </Button>
            </form>
          </div>

          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Todas as Obras</h2>

            <div className="mb-6 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar nome da obra ou número do orçamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-2.5 text-white/50" size={20} />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {loadingObras ? (
              <div className="text-white/80 text-center py-8">Carregando obras...</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <button
                    onClick={() => toggleCategory("emAndamento")}
                    className="w-full flex items-center justify-between text-lg font-semibold text-white mb-3 hover:text-white/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      Em Andamento ({filteredObrasEmAndamento.length})
                    </div>
                    {expandedCategories.emAndamento ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>

                  {expandedCategories.emAndamento && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredObrasEmAndamento.length > 0 ? (
                        filteredObrasEmAndamento.map((obra) => (
                          <div key={obra.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-white font-medium text-sm">{obra.titulo}</div>
                            <div className="text-white/70 text-xs">{obra.cliente}</div>
                            <div className="text-white/50 text-xs mb-2">
                              {obra.data_inicio && new Date(obra.data_inicio).toLocaleDateString("pt-BR")}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditObra(obra)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                              >
                                <Edit size={12} />
                                Modificar
                              </button>
                              <button
                                onClick={() => handleDeleteObra(obra.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              >
                                <Trash2 size={12} />
                                Excluir
                              </button>
                              <button
                                onClick={() => handleGenerateLink(obra)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                              >
                                <LinkIcon size={12} />
                                Gerar Link
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/50 text-sm">Nenhuma obra em andamento</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => toggleCategory("concluido")}
                    className="w-full flex items-center justify-between text-lg font-semibold text-white mb-3 hover:text-white/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Concluído ({filteredObrasConcluidas.length})
                    </div>
                    {expandedCategories.concluido ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </button>

                  {expandedCategories.concluido && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filteredObrasConcluidas.length > 0 ? (
                        filteredObrasConcluidas.map((obra) => (
                          <div key={obra.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-white font-medium text-sm">{obra.titulo}</div>
                            <div className="text-white/70 text-xs">{obra.cliente}</div>
                            <div className="text-white/50 text-xs mb-2">
                              {obra.data_inicio && new Date(obra.data_inicio).toLocaleDateString("pt-BR")}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditObra(obra)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                              >
                                <Edit size={12} />
                                Modificar
                              </button>
                              <button
                                onClick={() => handleDeleteObra(obra.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                              >
                                <Trash2 size={12} />
                                Excluir
                              </button>
                              <button
                                onClick={() => handleGenerateLink(obra)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                              >
                                <LinkIcon size={12} />
                                Gerar Link
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/50 text-sm">Nenhuma obra concluída</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
