"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  MessageCircle,
  Building2,
  User,
  Upload,
  X,
  File,
  FileText,
  CheckCircle,
  XCircle,
  UserPlus,
  Calculator,
  ArrowLeft,
  Mail,
  Lock,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Eye,
  EyeOff,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// Tipos para garantir a tipagem correta dos dados
type ArquivoUpload = {
  file: File
  id: string
  nome: string
  tamanho: string
}

type Cliente = {
  id: string
  nome: string
  telefone: string
  endereco: string
  cpf_cnpj: string
  data_nascimento: string
  cidade: string
  estado: string
}

type Arquiteto = {
  id: string
  nome: string
  telefone: string
  endereco: string
  cau: string
  especialidade: string
  cidade: string
  estado: string
  cpf_cnpj: string
}

export default function NovoOrcamentoPage() {
  const [currentView, setCurrentView] = useState<"menu" | "cadastrar-usuario" | "gerar-orcamento">("menu")
  const [userType, setUserType] = useState<"cliente" | "arquiteto" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const [modalType, setModalType] = useState<"success" | "error" | "info">("info")
  const [uploadingFiles, setUploadingFiles] = useState(false)

  // Estados para cadastro de usuário
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    nome: "",
    telefone: "",
    endereco: "",
    cpf_cnpj: "",
    data_nascimento: "",
    cidade: "",
    estado: "",
    cau: "", // apenas para arquiteto
    especialidade: "", // apenas para arquiteto
  })

  // Estados para geração de orçamento
  const [numeroOrcamento, setNumeroOrcamento] = useState("")
  const [clienteSelecionado, setClienteSelecionado] = useState("")
  const [arquitetoSelecionado, setArquitetoSelecionado] = useState("")
  const [vendedor, setVendedor] = useState("")
  const [responsavelObra, setResponsavelObra] = useState("")
  const [observacao, setObservacao] = useState("")
  const [arquivos, setArquivos] = useState<ArquivoUpload[]>([])

  // Listas de clientes e arquitetos
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [arquitetos, setArquitetos] = useState<Arquiteto[]>([])

  const router = useRouter()

  useEffect(() => {
    if (currentView === "gerar-orcamento") {
      fetchClientesEArquitetos()
    }
  }, [currentView])

  const fetchClientesEArquitetos = async () => {
    try {
      const { data: clientesData, error: clientesError } = await supabase.from("clientes").select("*").order("nome")

      if (clientesError) {
        console.error("Erro ao buscar clientes:", clientesError)
      } else {
        setClientes(clientesData || [])
      }

      const { data: arquitetosData, error: arquitetosError } = await supabase
        .from("arquitetos")
        .select("*")
        .order("nome")

      if (arquitetosError) {
        console.error("Erro ao buscar arquitetos:", arquitetosError)
      } else {
        setArquitetos(arquitetosData || [])
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    }
  }

  const showCustomModal = (title: string, message: string, type: "success" | "error" | "info") => {
    setModalTitle(title)
    setModalMessage(message)
    setModalType(type)
    setShowModal(true)
  }

  const handleUserDataChange = (field: string, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCadastrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!userData.nome) {
        throw new Error("Nome é obrigatório.")
      }

      if (userType === "cliente") {
        const { error: clienteError } = await supabase.from("clientes").insert({
          nome: userData.nome,
          telefone: userData.telefone || null,
          endereco: userData.endereco || null,
          cpf_cnpj: userData.cpf_cnpj || null,
          data_nascimento: userData.data_nascimento || null,
          cidade: userData.cidade || null,
          estado: userData.estado || null,
        })

        if (clienteError) {
          throw new Error(`Erro ao cadastrar cliente: ${clienteError.message}`)
        }
      } else if (userType === "arquiteto") {
        const { error: arquitetoError } = await supabase.from("arquitetos").insert({
          nome: userData.nome,
          telefone: userData.telefone || null,
          endereco: userData.endereco || null,
          cpf_cnpj: userData.cpf_cnpj || null,
          cidade: userData.cidade || null,
          estado: userData.estado || null,
          cau: userData.cau || null,
          especialidade: userData.especialidade || null,
        })

        if (arquitetoError) {
          throw new Error(`Erro ao cadastrar arquiteto: ${arquitetoError.message}`)
        }
      }

      showCustomModal(
        "Sucesso!",
        `${userType === "cliente" ? "Cliente" : "Arquiteto"} cadastrado com sucesso! Os dados foram salvos no sistema e podem ser utilizados para gerar orçamentos.`,
        "success",
      )

      // Limpar formulário
      setUserData({
        email: "",
        password: "",
        nome: "",
        telefone: "",
        endereco: "",
        cpf_cnpj: "",
        data_nascimento: "",
        cidade: "",
        estado: "",
        cau: "",
        especialidade: "",
      })
      setUserType(null)
      setCurrentView("menu")
    } catch (error: any) {
      console.error("Erro ao cadastrar usuário:", error)

      let errorMessage = "Erro inesperado ao cadastrar usuário."

      if (error.message?.includes("duplicate key value")) {
        errorMessage = "Já existe um registro com esses dados. Verifique se o usuário já foi cadastrado."
      } else if (error.message) {
        errorMessage = error.message
      }

      showCustomModal("Erro", errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) => {
        const fileType = file.type
        return fileType.startsWith("image/") || fileType === "application/pdf"
      })

      if (arquivos.length + newFiles.length > 20) {
        showCustomModal("Limite de Arquivos", "Você pode adicionar no máximo 20 arquivos por orçamento.", "error")
        return
      }

      const filesToAdd = newFiles.map((file) => ({
        file: file,
        id: Math.random().toString(36).substring(2, 9),
        nome: file.name,
        tamanho: (file.size / 1024).toFixed(1),
      }))
      setArquivos((prevFiles) => [...prevFiles, ...filesToAdd])
    }
  }

  const handleRemoveFile = (id: string) => {
    setArquivos((prevFiles) => prevFiles.filter((file) => file.id !== id))
  }

  const uploadFiles = async (orcamentoId: string) => {
    if (arquivos.length === 0) return []

    setUploadingFiles(true)
    const uploadedFilesData = []

    for (const arquivo of arquivos) {
      const { data, error } = await supabase.storage
        .from("orcamento-anexos")
        .upload(`${orcamentoId}/${arquivo.nome}`, arquivo.file, {
          upsert: true,
        })

      if (error) {
        console.error(`Erro ao fazer upload do arquivo ${arquivo.nome}:`, error)
      } else {
        const { data: publicUrlData } = supabase.storage.from("orcamento-anexos").getPublicUrl(data.path)

        uploadedFilesData.push({
          nome_original: arquivo.nome,
          url: publicUrlData.publicUrl,
        })
      }
    }

    setUploadingFiles(false)
    return uploadedFilesData
  }

  const handleGerarOrcamento = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!numeroOrcamento.trim() || !clienteSelecionado) {
        throw new Error("Número do orçamento e cliente são obrigatórios.")
      }

      // Inserir o novo orçamento
      const orcamentoData = {
        numero_orcamento: numeroOrcamento.trim(),
        cliente_id: clienteSelecionado,
        arquiteto_id: arquitetoSelecionado || null,
        vendedor: vendedor.trim() || null,
        responsavel_obra: responsavelObra.trim() || null,
        observacao: observacao.trim() || null,
        arquivos: [],
      }

      const { data, error } = await supabase.from("orcamentos").insert(orcamentoData).select().single()

      if (error) throw error

      let uploadedFiles = []
      if (arquivos.length > 0) {
        uploadedFiles = await uploadFiles(data.id)
      }

      if (uploadedFiles.length > 0) {
        const { error: updateError } = await supabase
          .from("orcamentos")
          .update({ arquivos: uploadedFiles })
          .eq("id", data.id)

        if (updateError) {
          console.error("Erro ao atualizar o orçamento com URLs dos arquivos:", updateError)
        }
      }

      showCustomModal("Sucesso!", "Orçamento gerado com sucesso.", "success")

      // Limpar formulário
      setNumeroOrcamento("")
      setClienteSelecionado("")
      setArquitetoSelecionado("")
      setVendedor("")
      setResponsavelObra("")
      setObservacao("")
      setArquivos([])
      setCurrentView("menu")
    } catch (error: any) {
      console.error("Erro ao gerar orçamento:", error)
      showCustomModal("Erro", error.message || "Ocorreu um erro ao gerar o orçamento. Tente novamente.", "error")
    } finally {
      setLoading(false)
    }
  }

  const renderMenu = () => (
    <div className="max-w-4xl mx-auto py-8">
      <div className="glass-effect bg-slate-800/90 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">Novo Orçamento</h1>
        <p className="text-slate-200 mb-6 sm:mb-8 text-sm sm:text-base">Escolha uma das opções abaixo para começar.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setCurrentView("cadastrar-usuario")}
            className="glass-effect bg-slate-700/90 border border-slate-600/50 rounded-xl p-6 hover:bg-slate-600/90 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center text-center">
              <UserPlus
                size={48}
                className="text-[var(--secondary-blue)] mb-4 group-hover:scale-110 transition-transform"
              />
              <h3 className="text-xl font-bold text-slate-100 mb-2">CADASTRAR USUÁRIO</h3>
              <p className="text-slate-200 text-sm">Cadastre um novo cliente ou arquiteto no sistema</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentView("gerar-orcamento")}
            className="glass-effect bg-slate-700/90 border border-slate-600/50 rounded-xl p-6 hover:bg-slate-600/90 transition-all duration-300 group"
          >
            <div className="flex flex-col items-center text-center">
              <Calculator
                size={48}
                className="text-[var(--secondary-blue)] mb-4 group-hover:scale-110 transition-transform"
              />
              <h3 className="text-xl font-bold text-slate-100 mb-2">GERAR ORÇAMENTO</h3>
              <p className="text-slate-200 text-sm">Crie um novo orçamento para um cliente existente</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )

  const renderCadastrarUsuario = () => (
    <div className="max-w-4xl mx-auto py-8">
      <div className="glass-effect bg-slate-800/90 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setCurrentView("menu")
              setUserType(null)
              setUserData({
                email: "",
                password: "",
                nome: "",
                telefone: "",
                endereco: "",
                cpf_cnpj: "",
                data_nascimento: "",
                cidade: "",
                estado: "",
                cau: "",
                especialidade: "",
              })
            }}
            className="mr-4 text-slate-200 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Cadastrar Usuário</h1>
        </div>

        {!userType ? (
          <div>
            <p className="text-slate-200 mb-6 text-sm sm:text-base">
              Selecione o tipo de usuário que deseja cadastrar.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setUserType("cliente")}
                className="glass-effect bg-slate-700/90 border border-slate-600/50 rounded-xl p-6 hover:bg-slate-600/90 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center">
                  <User
                    size={48}
                    className="text-[var(--secondary-blue)] mb-4 group-hover:scale-110 transition-transform"
                  />
                  <h3 className="text-xl font-bold text-slate-100 mb-2">CLIENTE</h3>
                  <p className="text-slate-200 text-sm">Cadastrar um novo cliente</p>
                </div>
              </button>

              <button
                onClick={() => setUserType("arquiteto")}
                className="glass-effect bg-slate-700/90 border border-slate-600/50 rounded-xl p-6 hover:bg-slate-600/90 transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center">
                  <Building2
                    size={48}
                    className="text-[var(--secondary-blue)] mb-4 group-hover:scale-110 transition-transform"
                  />
                  <h3 className="text-xl font-bold text-slate-100 mb-2">ARQUITETO</h3>
                  <p className="text-slate-200 text-sm">Cadastrar um novo arquiteto</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCadastrarUsuario} className="space-y-6">
            <p className="text-slate-200 mb-6 text-sm sm:text-base">
              Preencha os dados do {userType === "cliente" ? "cliente" : "arquiteto"}.
            </p>

            {/* Dados de login */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-slate-100 font-medium mb-2">
                  <Mail size={16} className="inline-block mr-2" />
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => handleUserDataChange("email", e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  placeholder="email@exemplo.com"
                  required
                />
                <div className="relative">
                  <label htmlFor="password" className="block text-slate-100 font-medium mb-2 mt-4">
                    <Lock size={16} className="inline-block mr-2" />
                    Senha *
                  </label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={userData.password}
                    onChange={(e) => handleUserDataChange("password", e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] pr-10"
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-300 mt-7"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="nome" className="block text-slate-100 font-medium mb-2">
                  <User size={16} className="inline-block mr-2" />
                  Nome Completo *
                </label>
                <input
                  id="nome"
                  type="text"
                  value={userData.nome}
                  onChange={(e) => handleUserDataChange("nome", e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  placeholder="Nome completo do usuário"
                  required
                />
              </div>
            </div>

            {/* Dados de contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="telefone" className="block text-slate-100 font-medium mb-2">
                  <Phone size={16} className="inline-block mr-2" />
                  Telefone
                </label>
                <input
                  id="telefone"
                  type="text"
                  value={userData.telefone}
                  onChange={(e) => handleUserDataChange("telefone", e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>
              <div>
                <label htmlFor="endereco" className="block text-slate-100 font-medium mb-2">
                  <MapPin size={16} className="inline-block mr-2" />
                  Endereço
                </label>
                <input
                  id="endereco"
                  type="text"
                  value={userData.endereco}
                  onChange={(e) => handleUserDataChange("endereco", e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  placeholder="Rua, número, bairro"
                />
              </div>
            </div>

            {/* CPF/CNPJ e Data de Nascimento (apenas para cliente) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cpf_cnpj" className="block text-slate-100 font-medium mb-2">
                  <FileText size={16} className="inline-block mr-2" />
                  CPF/CNPJ
                </label>
                <input
                  id="cpf_cnpj"
                  type="text"
                  value={userData.cpf_cnpj}
                  onChange={(e) => handleUserDataChange("cpf_cnpj", e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  placeholder="XXX.XXX.XXX-XX ou XX.XXX.XXX/XXXX-XX"
                />
              </div>
              {userType === "cliente" && (
                <div>
                  <label htmlFor="data_nascimento" className="block text-slate-100 font-medium mb-2">
                    <Calendar size={16} className="inline-block mr-2" />
                    Data de Nascimento
                  </label>
                  <input
                    id="data_nascimento"
                    type="date"
                    value={userData.data_nascimento}
                    onChange={(e) => handleUserDataChange("data_nascimento", e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  />
                </div>
              )}
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cidade" className="block text-slate-100 font-medium mb-2">
                  <MapPin size={16} className="inline-block mr-2" />
                  Cidade
                </label>
                <input
                  id="cidade"
                  type="text"
                  value={userData.cidade}
                  onChange={(e) => handleUserDataChange("cidade", e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  placeholder="Cidade"
                />
              </div>
              <div>
                <label htmlFor="estado" className="block text-slate-100 font-medium mb-2">
                  <MapPin size={16} className="inline-block mr-2" />
                  Estado
                </label>
                <input
                  id="estado"
                  type="text"
                  value={userData.estado}
                  onChange={(e) => handleUserDataChange("estado", e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                  placeholder="Estado (UF)"
                />
              </div>
            </div>

            {/* CAU e Especialidade (apenas para arquiteto) */}
            {userType === "arquiteto" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cau" className="block text-slate-100 font-medium mb-2">
                    <Briefcase size={16} className="inline-block mr-2" />
                    CAU
                  </label>
                  <input
                    id="cau"
                    type="text"
                    value={userData.cau}
                    onChange={(e) => handleUserDataChange("cau", e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                    placeholder="CAU do arquiteto"
                  />
                </div>
                <div>
                  <label htmlFor="especialidade" className="block text-slate-100 font-medium mb-2">
                    <DollarSign size={16} className="inline-block mr-2" />
                    Especialidade
                  </label>
                  <input
                    id="especialidade"
                    type="text"
                    value={userData.especialidade}
                    onChange={(e) => handleUserDataChange("especialidade", e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-4 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                    placeholder="Especialidade do arquiteto"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[var(--primary-blue)] text-white font-bold py-3 px-4 rounded-md hover:bg-[var(--primary-blue-dark)] transition-colors duration-300 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <>
                  <UserPlus size={20} className="mr-2" />
                  Cadastrar {userType === "cliente" ? "Cliente" : "Arquiteto"}
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Modal de Sucesso/Erro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-effect rounded-lg p-8 max-w-sm w-full text-center relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white"
            >
              <X size={24} />
            </button>
            {modalType === "success" && <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />}
            {modalType === "error" && <XCircle size={48} className="text-red-500 mx-auto mb-4" />}
            {modalType === "info" && <MessageCircle size={48} className="text-blue-500 mx-auto mb-4" />}
            <h2 className="text-xl font-bold text-white mb-2">{modalTitle}</h2>
            <p className="text-white/80 mb-4">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-[var(--primary-blue)] text-white font-bold py-2 px-4 rounded-md hover:bg-[var(--primary-blue-dark)] transition-colors duration-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderGerarOrcamento = () => (
    <div className="max-w-4xl mx-auto py-8">
      <div className="glass-effect bg-slate-800/90 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => {
              setCurrentView("menu")
              setNumeroOrcamento("")
              setClienteSelecionado("")
              setArquitetoSelecionado("")
              setVendedor("")
              setResponsavelObra("")
              setObservacao("")
              setArquivos([])
            }}
            className="mr-4 text-slate-200 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Gerar Orçamento</h1>
        </div>

        <form onSubmit={handleGerarOrcamento} className="space-y-6">
          <p className="text-slate-200 mb-6 text-sm sm:text-base">Preencha os detalhes para gerar um novo orçamento.</p>

          {/* Número do Orçamento */}
          <div>
            <label htmlFor="numeroOrcamento" className="block text-white font-medium mb-2">
              <File size={16} className="inline-block mr-2" />
              Número do Orçamento *
            </label>
            <input
              id="numeroOrcamento"
              type="text"
              value={numeroOrcamento}
              onChange={(e) => setNumeroOrcamento(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
              placeholder="Ex: 2023-001"
              required
            />
          </div>

          {/* Cliente e Arquiteto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="clienteSelecionado" className="block text-white font-medium mb-2">
                <User size={16} className="inline-block mr-2" />
                Cliente *
              </label>
              <select
                id="clienteSelecionado"
                value={clienteSelecionado}
                onChange={(e) => setClienteSelecionado(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="arquitetoSelecionado" className="block text-white font-medium mb-2">
                <Building2 size={16} className="inline-block mr-2" />
                Arquiteto
              </label>
              <select
                id="arquitetoSelecionado"
                value={arquitetoSelecionado}
                onChange={(e) => setArquitetoSelecionado(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
              >
                <option value="">Selecione um arquiteto (Opcional)</option>
                {arquitetos.map((arquiteto) => (
                  <option key={arquiteto.id} value={arquiteto.id}>
                    {arquiteto.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendedor e Responsável pela Obra */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="vendedor" className="block text-white font-medium mb-2">
                <User size={16} className="inline-block mr-2" />
                Vendedor
              </label>
              <input
                id="vendedor"
                type="text"
                value={vendedor}
                onChange={(e) => setVendedor(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                placeholder="Nome do vendedor"
              />
            </div>
            <div>
              <label htmlFor="responsavelObra" className="block text-white font-medium mb-2">
                <User size={16} className="inline-block mr-2" />
                Responsável pela Obra
              </label>
              <input
                id="responsavelObra"
                type="text"
                value={responsavelObra}
                onChange={(e) => setResponsavelObra(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                placeholder="Nome do responsável pela obra"
              />
            </div>
          </div>

          {/* Observação */}
          <div>
            <label htmlFor="observacao" className="block text-white font-medium mb-2">
              <MessageCircle size={16} className="inline-block mr-2" />
              Observação
            </label>
            <textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={4}
              className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
              placeholder="Adicione quaisquer observações relevantes sobre o orçamento..."
            ></textarea>
          </div>

          {/* Upload de Arquivos */}
          <div>
            <label htmlFor="file-upload" className="block text-white font-medium mb-2">
              <Upload size={16} className="inline-block mr-2" />
              Anexar Arquivos (Imagens ou PDFs)
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="w-full text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-blue)] file:text-white hover:file:bg-[var(--primary-blue-dark)] file:transition-colors file:duration-300"
            />
            <p className="text-white/60 text-sm mt-1">Máximo de 20 arquivos. Tamanho máximo por arquivo: 5MB.</p>

            {arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-white font-medium">Arquivos Selecionados:</h3>
                {arquivos.map((arquivo) => (
                  <div key={arquivo.id} className="flex items-center justify-between bg-white/10 p-3 rounded-md">
                    <div className="flex items-center">
                      {arquivo.file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(arquivo.file) || "/placeholder.svg"}
                          alt={arquivo.nome}
                          className="h-8 w-8 object-cover rounded-sm mr-2"
                        />
                      ) : (
                        <FileText size={20} className="text-white/70 mr-2" />
                      )}
                      <span className="text-white text-sm truncate max-w-[calc(100%-80px)]">
                        {arquivo.nome} ({arquivo.tamanho} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(arquivo.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--primary-blue)] text-white font-bold py-3 px-4 rounded-md hover:bg-[var(--primary-blue-dark)] transition-colors duration-300 flex items-center justify-center"
            disabled={loading || uploadingFiles}
          >
            {loading || uploadingFiles ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <>
                <Calculator size={20} className="mr-2" />
                Gerar Orçamento
              </>
            )}
          </button>
        </form>
      </div>

      {/* Modal de Sucesso/Erro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass-effect rounded-lg p-8 max-w-sm w-full text-center relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white"
            >
              <X size={24} />
            </button>
            {modalType === "success" && <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />}
            {modalType === "error" && <XCircle size={48} className="text-red-500 mx-auto mb-4" />}
            {modalType === "info" && <MessageCircle size={48} className="text-blue-500 mx-auto mb-4" />}
            <h2 className="text-xl font-bold text-white mb-2">{modalTitle}</h2>
            <p className="text-white/80 mb-4">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-[var(--primary-blue)] text-white font-bold py-2 px-4 rounded-md hover:bg-[var(--primary-blue-dark)] transition-colors duration-300"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )

  switch (currentView) {
    case "cadastrar-usuario":
      return renderCadastrarUsuario()
    case "gerar-orcamento":
      return renderGerarOrcamento()
    case "menu":
    default:
      return renderMenu()
  }
}
