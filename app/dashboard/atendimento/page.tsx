"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  MessageCircle,
  User,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Upload,
  X,
  File,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

// Tipos para garantir a tipagem correta dos dados
type Profile = {
  id: string
  nome?: string
  nickname?: string
}

type ArquivoUpload = {
  file: File
  id: string
  nome: string
  tamanho: string
}

export default function RegistroAtendimentoPage() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info")

  // Estados do formulário, agora correspondendo aos campos de exibição
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cidade, setCidade] = useState("")
  const [endereco, setEndereco] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [status, setStatus] = useState("pendente")
  const [atendente, setAtendente] = useState("") // Para armazenar o nome/nickname do usuário logado

  const [dataAgendamento, setDataAgendamento] = useState<Date | undefined>(undefined)
  const [showCalendar, setShowCalendar] = useState(false)
  const [horaAgendamento, setHoraAgendamento] = useState("")

  // Estados para gerenciamento de upload de arquivos
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Função para mostrar o modal
  const showCustomModal = (title: string, message: string, type: "success" | "error" | "info") => {
    setModalTitle(title)
    setModalMessage(message)
    setModalType(type)
    setShowModal(true)
  }

  // Função para lidar com o upload de arquivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newFiles: ArquivoUpload[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const id = Math.random().toString(36).substr(2, 9)
      const tamanho = (file.size / 1024 / 1024).toFixed(2) + " MB"

      newFiles.push({
        file,
        id,
        nome: file.name,
        tamanho,
      })
    }

    setArquivos((prev) => [...prev, ...newFiles])
    // Reset input
    event.target.value = ""
  }

  // Função para remover arquivos
  const removeFile = (id: string) => {
    setArquivos((prev) => prev.filter((arquivo) => arquivo.id !== id))
  }

  const uploadFilesToStorage = async (atendimentoId: string) => {
    if (arquivos.length === 0) return []

    setUploadingFiles(true)
    const uploadedFiles = []

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      for (const arquivo of arquivos) {
        const fileExt = arquivo.file.name.split(".").pop()
        const fileName = `${atendimentoId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("atendimento-arquivos")
          .upload(fileName, arquivo.file)

        if (uploadError) {
          console.error("Erro no upload:", uploadError)
          continue
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("atendimento-arquivos").getPublicUrl(fileName)

        uploadedFiles.push({
          nome_arquivo: fileName,
          nome_original: arquivo.file.name,
          tipo_arquivo: arquivo.file.type,
          tamanho_arquivo: arquivo.file.size,
          url_arquivo: publicUrl,
        })
      }

      if (uploadedFiles.length > 0) {
        const { error: updateError } = await supabase
          .from("atendimentos")
          .update({ arquivos: uploadedFiles })
          .eq("id", atendimentoId)

        if (updateError) {
          console.error("Erro ao salvar arquivos no atendimento:", updateError)
        }
      }
    } catch (error) {
      console.error("Erro geral no upload:", error)
    } finally {
      setUploadingFiles(false)
    }

    return uploadedFiles
  }

  // Efeito para buscar o nome do atendente (nickname do usuário logado)
  useEffect(() => {
    const fetchUserNickname = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).single()

          if (profile?.nickname) {
            setAtendente(profile.nickname)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do usuário:", error)
      }
    }
    fetchUserNickname()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica dos campos obrigatórios
    if (!nome.trim() || !telefone.trim() || !observacoes.trim()) {
      showCustomModal("Campos Faltando", "Por favor, preencha todos os campos obrigatórios.", "error")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        showCustomModal(
          "Erro de Autenticação",
          "Você precisa estar logado para registrar um atendimento. Faça login novamente.",
          "error",
        )
        return
      }

      if (!atendente) {
        showCustomModal(
          "Erro de Autenticação",
          "Não foi possível identificar o atendente. Tente recarregar a página.",
          "error",
        )
        return
      }

      // Obtém a data atual no formato 'YYYY-MM-DD'
      const dataAtendimento = new Date().toISOString().split("T")[0]

      const agendamentoData =
        dataAgendamento && horaAgendamento
          ? {
              data_agendamento: dataAgendamento.toISOString().split("T")[0],
              hora_agendamento: horaAgendamento,
            }
          : {}

      const { data: insertedAtendimentoData, error } = await supabase
        .from("atendimentos")
        .insert({
          nome: nome.trim(),
          telefone: telefone.trim(),
          cidade: cidade.trim(),
          endereco: endereco.trim(),
          observacoes: observacoes.trim(),
          status,
          atendente: atendente,
          data_atendimento: dataAtendimento,
          arquivos: [], // Inicializar com array vazio
          user_id: user.id, // Add user_id for RLS policy
          ...agendamentoData, // Incluindo dados de agendamento
        })
        .select()
        .single()

      if (error) {
        console.error("Erro ao registrar atendimento:", error)
        showCustomModal("Erro", `Erro ao registrar atendimento: ${error.message}`, "error")
        return
      }

      if (arquivos.length > 0) {
        await uploadFilesToStorage(insertedAtendimentoData.id)
      }

      // Limpar formulário
      setNome("")
      setTelefone("")
      setCidade("")
      setEndereco("")
      setObservacoes("")
      setStatus("pendente")
      setArquivos([]) // Clear uploaded files
      setDataAgendamento(undefined)
      setHoraAgendamento("")

      // Mostrar modal de sucesso
      showCustomModal("Atendimento Registrado!", "O atendimento foi registrado com sucesso no sistema.", "success")
    } catch (error) {
      console.error("Erro geral:", error)
      showCustomModal("Erro", "Ocorreu um erro inesperado. Tente novamente.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-2xl p-6 mb-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">Registro de Atendimento</h1>
          <p className="text-white/80">Registre um novo atendimento ao cliente</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <Calendar className="inline mr-2" size={20} />
              Agendamento (Opcional)
            </label>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={
                    dataAgendamento && horaAgendamento
                      ? `Agendar para o dia: ${dataAgendamento.toLocaleDateString("pt-BR")} às ${horaAgendamento}`
                      : dataAgendamento
                        ? `Agendar para o dia: ${dataAgendamento.toLocaleDateString("pt-BR")} - Selecione a hora`
                        : "Agendar para o dia: [data] às [hora]"
                  }
                  onClick={() => setShowCalendar(!showCalendar)}
                  readOnly
                  placeholder="Agendar para o dia: [data] às [hora]"
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:border-[var(--secondary-blue)] focus:outline-none cursor-pointer"
                />

                {showCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-10 bg-white rounded-lg shadow-xl border">
                    <CalendarComponent
                      mode="single"
                      selected={dataAgendamento}
                      onSelect={(date) => {
                        setDataAgendamento(date)
                        setShowCalendar(false)
                      }}
                      disabled={(date) => date < new Date()}
                      className="rounded-lg"
                    />
                  </div>
                )}
              </div>

              {dataAgendamento && (
                <div>
                  <label className="block text-white font-semibold mb-2">Horário</label>
                  <select
                    value={horaAgendamento}
                    onChange={(e) => setHoraAgendamento(e.target.value)}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[var(--secondary-blue)] focus:outline-none"
                  >
                    <option value="" className="bg-[var(--primary-blue-dark)] text-white">
                      Selecione um horário
                    </option>
                    <option value="08:00" className="bg-[var(--primary-blue-dark)] text-white">
                      08:00
                    </option>
                    <option value="09:00" className="bg-[var(--primary-blue-dark)] text-white">
                      09:00
                    </option>
                    <option value="10:00" className="bg-[var(--primary-blue-dark)] text-white">
                      10:00
                    </option>
                    <option value="11:00" className="bg-[var(--primary-blue-dark)] text-white">
                      11:00
                    </option>
                    <option value="13:00" className="bg-[var(--primary-blue-dark)] text-white">
                      13:00
                    </option>
                    <option value="14:00" className="bg-[var(--primary-blue-dark)] text-white">
                      14:00
                    </option>
                    <option value="15:00" className="bg-[var(--primary-blue-dark)] text-white">
                      15:00
                    </option>
                    <option value="16:00" className="bg-[var(--primary-blue-dark)] text-white">
                      16:00
                    </option>
                    <option value="17:00" className="bg-[var(--primary-blue-dark)] text-white">
                      17:00
                    </option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Nome do Cliente */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <User className="inline mr-2" size={20} />
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome completo do cliente..."
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[var(--primary-blue-dark)] focus:border-[var(--secondary-blue)] focus:outline-none"
              required
            />
          </div>

          {/* Telefone */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <Phone className="inline mr-2" size={20} />
              Telefone *
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(33) 9 9999-9999"
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[var(--primary-blue-dark)] focus:border-[var(--secondary-blue)] focus:outline-none"
              required
            />
          </div>

          {/* Cidade */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <MapPin className="inline mr-2" size={20} />
              Cidade (Opcional)
            </label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Manhuaçu/MG"
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[var(--primary-blue-dark)] focus:border-[var(--secondary-blue)] focus:outline-none"
            />
          </div>

          {/* Endereço */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <MapPin className="inline mr-2" size={20} />
              Endereço (Opcional)
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua Exemplo, 123"
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[var(--primary-blue-dark)] focus:border-[var(--secondary-blue)] focus:outline-none"
            />
          </div>

          {/* Observações */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <FileText className="inline mr-2" size={20} />
              Observações do Atendimento *
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva detalhadamente o atendimento, necessidades do cliente, observações importantes..."
              rows={6}
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-[var(--primary-blue-dark)] focus:border-[var(--secondary-blue)] focus:outline-none resize-vertical"
              required
            />
          </div>

          {/* Status */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <Calendar className="inline mr-2" size={20} />
              Status do Atendimento
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[var(--secondary-blue)] focus:outline-none"
            >
              <option value="pendente" className="bg-[var(--primary-blue-dark)] text-white">
                Pendente
              </option>
              <option value="em_andamento" className="bg-[var(--primary-blue-dark)] text-white">
                Em Andamento
              </option>
              <option value="concluido" className="bg-[var(--primary-blue-dark)] text-white">
                Concluído
              </option>
              <option value="cancelado" className="bg-[var(--primary-blue-dark)] text-white">
                Cancelado
              </option>
            </select>
          </div>

          {/* Anexar Arquivos */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <label className="block text-white font-semibold mb-3">
              <Upload className="inline mr-2" size={20} />
              Anexar Arquivos (Opcional)
            </label>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-white/50 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto mb-2 text-white/60" size={32} />
                  <p className="text-white/80 mb-1">Clique para selecionar arquivos</p>
                  <p className="text-white/60 text-sm">Imagens, PDFs, documentos (ilimitados)</p>
                </label>
              </div>

              {/* Lista de arquivos selecionados */}
              {arquivos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-semibold text-sm">Arquivos selecionados:</h4>
                  {arquivos.map((arquivo) => (
                    <div key={arquivo.id} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <File size={16} className="text-white/60" />
                        <span className="text-white text-sm">{arquivo.nome}</span>
                        <span className="text-white/60 text-xs">({arquivo.tamanho})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(arquivo.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botão de envio */}
          <button
            type="submit"
            disabled={loading || uploadingFiles}
            className="w-full bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue-dark)] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : uploadingFiles ? "Enviando arquivos..." : "Registrar Atendimento"}
          </button>
        </form>
      </div>

      {/* Modal genérico para sucesso, erro ou info */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-effect rounded-2xl p-8 border border-white/20 max-w-md w-full text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalType === "success" ? "bg-green-500" : modalType === "error" ? "bg-red-500" : "bg-blue-500"}`}
            >
              {modalType === "success" ? (
                <CheckCircle className="text-white" size={32} />
              ) : modalType === "error" ? (
                <XCircle className="text-white" size={32} />
              ) : (
                <MessageCircle className="text-white" size={32} />
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{modalTitle}</h3>
            <p className="text-white/80 mb-6">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue-dark)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
