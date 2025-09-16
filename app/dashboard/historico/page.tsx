"use client"

import type React from "react"

import { useSearchParams } from "next/navigation"
import {
  Paperclip,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Copy,
  X,
  Upload,
  DownloadIcon,
  Send,
  Plus,
  Link,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { useState, useEffect } from "react"
import { supabase, type Atendimento, type Profile as UserProfile } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MessageSquare, Edit, Trash2, AlertTriangle, Search, Filter, File } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import jsPDF from "jspdf"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type AtendimentoArquivo = {
  nome_arquivo: string
  nome_original: string
  tipo_arquivo: string
  tamanho_arquivo: number
  url_arquivo: string
  created_at?: string
  id: string
}

interface Atendente {
  id: string
  nome: string
  telefone: string
  created_at: string
}

export default function HistoricoPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [filteredAtendimentos, setFilteredAtendimentos] = useState<Atendimento[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingStatus, setEditingStatus] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [dateFilter, setDateFilter] = useState<"todos" | "hoje" | "semana" | "mes">("todos")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [expandedAtendimentos, setExpandedAtendimentos] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalType, setModalType] = useState<"success" | "error">("success")
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null)
  const [editingAtendimento, setEditingAtendimento] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Atendimento>>({})

  const [editingFiles, setEditingFiles] = useState<AtendimentoArquivo[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const [atendentes, setAtendentes] = useState<Atendente[]>([])
  const [showAddVendorModal, setShowAddVendorModal] = useState(false)
  const [newVendorName, setNewVendorName] = useState("")
  const [newVendorPhone, setNewVendorPhone] = useState("")
  const [selectedAtendente, setSelectedAtendente] = useState<Atendente | null>(null)
  const [showAtendenteMenu, setShowAtendenteMenu] = useState<string | null>(null)

  const searchParams = useSearchParams()

  const { toast } = useToast()

  const filterByDate = (atendimentos: Atendimento[], filter: string) => {
    if (filter === "todos") return atendimentos

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return atendimentos.filter((atendimento) => {
      const createdAt = new Date(atendimento.created_at)

      switch (filter) {
        case "hoje":
          const atendimentoDate = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate())
          return atendimentoDate.getTime() === today.getTime()

        case "semana":
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
          startOfWeek.setHours(0, 0, 0, 0)
          const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
          endOfWeek.setHours(23, 59, 59, 999)
          return createdAt >= startOfWeek && createdAt <= endOfWeek

        case "mes":
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          startOfMonth.setHours(0, 0, 0, 0)
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
          endOfMonth.setHours(23, 59, 59, 999)
          return createdAt >= startOfMonth && createdAt <= endOfMonth

        default:
          return true
      }
    })
  }

  const filterByDateRange = (atendimentos: Atendimento[]) => {
    if (!startDate && !endDate) return atendimentos

    return atendimentos.filter((atendimento) => {
      const createdAt = new Date(atendimento.created_at)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate + "T23:59:59") : null

      if (start && end) {
        return createdAt >= start && createdAt <= end
      } else if (start) {
        return createdAt >= start
      } else if (end) {
        return createdAt <= end
      }
      return true
    })
  }

  const fetchData = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro ao buscar usuário:", userError)
        return
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError)
        } else {
          setUserProfile(profile)
        }

        const { data: atendimentosData, error: atendimentosError } = await supabase
          .from("atendimentos")
          .select("*")
          .order("created_at", { ascending: false })

        if (atendimentosError) {
          console.error("Erro ao buscar atendimentos:", atendimentosError)
        } else {
          const atendimentosComArquivos = await Promise.all(
            atendimentosData.map(async (atendimento) => {
              const { data: arquivos } = await supabase
                .from("atendimento_arquivos")
                .select("*")
                .eq("atendimento_id", atendimento.id)
                .order("created_at", { ascending: false })

              return {
                ...atendimento,
                arquivos: arquivos || [],
              }
            }),
          )

          setAtendimentos(atendimentosComArquivos)
          setFilteredAtendimentos(atendimentosComArquivos)
        }
      }
    } catch (error) {
      console.error("Erro geral ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async (arquivo: AtendimentoArquivo) => {
    try {
      const { data, error } = await supabase.storage.from("atendimento-arquivos").download(arquivo.nome_arquivo)

      if (error) {
        console.error("Erro ao baixar do storage:", error)
        if (arquivo.url_arquivo) {
          window.open(arquivo.url_arquivo, "_blank")
          return
        }
        throw new Error("Arquivo não encontrado")
      }

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = arquivo.nome_original
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error)
      showMessage("Erro ao baixar arquivo. Tente novamente.", "error")
    }
  }

  const loadImageAsBase64 = async (input: AtendimentoArquivo | string): Promise<string> => {
    try {
      // Handle string input (like logo path)
      if (typeof input === "string") {
        const response = await fetch(input, {
          mode: "cors",
          credentials: "omit",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }

        const blob = await response.blob()

        // Verify it's actually an image
        if (!blob.type.startsWith("image/")) {
          throw new Error("File is not an image")
        }

        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error("Failed to read image as base64"))
          reader.readAsDataURL(blob)
        })
      }

      // Handle arquivo object
      const arquivo = input as AtendimentoArquivo

      // Try to download from Supabase storage first
      const { data, error } = await supabase.storage.from("atendimento-arquivos").download(arquivo.nome_arquivo)

      if (error) {
        console.error("Error downloading from storage:", error)
        // Fallback to direct URL fetch if storage download fails
        if (arquivo.url || arquivo.url_arquivo) {
          const response = await fetch(arquivo.url || arquivo.url_arquivo, {
            mode: "cors",
            credentials: "omit",
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`)
          }

          const blob = await response.blob()

          // Verify it's actually an image
          if (!blob.type.startsWith("image/")) {
            throw new Error("File is not an image")
          }

          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error("Failed to read image as base64"))
            reader.readAsDataURL(blob)
          })
        }
        throw error
      }

      // Verify it's actually an image
      if (!data.type.startsWith("image/")) {
        throw new Error("File is not an image")
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Failed to read image as base64"))
        reader.readAsDataURL(data)
      })
    } catch (error) {
      console.error("Error loading image:", error)
      throw error
    }
  }

  const generateAtendimentoPDF = async (atendimento: Atendimento) => {
    try {
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      // Function to add a new page if necessary
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage()
          addHeaderAndFooter()
          yPosition = margin + 25
          return true
        }
        return false
      }

      const addHeaderAndFooter = async () => {
        // Header background with color #396496
        pdf.setFillColor(57, 100, 150)
        pdf.rect(0, 0, pageWidth, 25, "F")

        // Logo on the left - fixed to use proper path
        try {
          const logoBase64 = await loadImageAsBase64("/LOGO.png")
          if (logoBase64) {
            const tempImg = new window.Image()
            tempImg.src = logoBase64
            await new Promise((resolve) => (tempImg.onload = resolve))

            const logoWidth = tempImg.width
            const logoHeight = tempImg.height
            const maxHeight = 15
            const maxWidth = 20

            let scaledWidth = maxWidth
            let scaledHeight = (logoHeight * maxWidth) / logoWidth

            if (scaledHeight > maxHeight) {
              scaledHeight = maxHeight
              scaledWidth = (logoWidth * maxHeight) / logoHeight
            }

            const logoX = margin + (maxWidth - scaledWidth) / 2
            const logoY = 5 + (maxHeight - scaledHeight) / 2
            pdf.addImage(logoBase64, "PNG", margin, logoY, scaledWidth, scaledHeight)
          }
        } catch (error) {
          console.error("Error loading logo:", error)
        }

        // Title "ATENDIMENTO" centered
        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(255, 255, 255)
        const titleWidth = pdf.getTextWidth("ATENDIMENTO")
        pdf.text("ATENDIMENTO", (pageWidth - titleWidth) / 2, 15)

        // Subtitle below title
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        const subtitle = "marketingdesignvidraçaria@gmail.com / (33) 99998 - 8240"
        const subtitleWidth = pdf.getTextWidth(subtitle)
        pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 20)

        // Footer background with color #396496
        pdf.setFillColor(57, 100, 150)
        pdf.rect(0, pageHeight - 15, pageWidth, 15, "F")

        // Footer text - same as portfolio
        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(255, 255, 255)
        const footerText = "© 2025 Design Vidraçaria. Todos os direitos reservados."
        const footerWidth = pdf.getTextWidth(footerText)
        pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 8)

        // Reset text color to black for content
        pdf.setTextColor(0, 0, 0)
      }

      await addHeaderAndFooter()
      yPosition = margin + 25

      // Client details - start directly without section header
      pdf.setFontSize(12)
      pdf.setTextColor(0, 0, 0)

      pdf.setFont("helvetica", "bold")
      pdf.text("Nome: ", margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(` ${atendimento.nome}`, margin + pdf.getTextWidth("Nome: "), yPosition)
      yPosition += 8

      pdf.setFont("helvetica", "bold")
      pdf.text("Telefone: ", margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(` ${atendimento.telefone}`, margin + pdf.getTextWidth("Telefone: "), yPosition)
      yPosition += 8

      pdf.setFont("helvetica", "bold")
      pdf.text("Cidade: ", margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(` ${atendimento.cidade}`, margin + pdf.getTextWidth("Cidade: "), yPosition)
      yPosition += 8

      pdf.setFont("helvetica", "bold")
      pdf.text("Endereço: ", margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(` ${atendimento.endereco}`, margin + pdf.getTextWidth("Endereço: "), yPosition)
      yPosition += 8

      pdf.setFont("helvetica", "bold")
      pdf.text("Atendente: ", margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(` ${atendimento.atendente}`, margin + pdf.getTextWidth("Atendente: "), yPosition)
      yPosition += 8

      pdf.setFont("helvetica", "bold")
      pdf.text("Data de Criação: ", margin, yPosition)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        ` ${new Date(atendimento.created_at).toLocaleDateString("pt-BR")}`,
        margin + pdf.getTextWidth("Data de Criação: "),
        yPosition,
      )
      yPosition += 15

      // Observations section - start directly without section header
      if (atendimento.observacoes) {
        checkPageBreak(30)

        pdf.setFontSize(10)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(0, 0, 0)
        const splitObservations = pdf.splitTextToSize(atendimento.observacoes, pageWidth - margin * 2)
        pdf.text(splitObservations, margin, yPosition)
        yPosition += splitObservations.length * 5 + 10
      }

      const hasFiles = atendimento.arquivos && atendimento.arquivos.length > 0
      let hasImages = false
      let hasOtherFiles = false

      if (hasFiles) {
        const imageFiles = atendimento.arquivos.filter(
          (arquivo: any) =>
            arquivo.tipo_arquivo?.startsWith("image/") ||
            arquivo.nome_original?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i),
        )
        const otherFiles = atendimento.arquivos.filter(
          (arquivo: any) =>
            !arquivo.tipo_arquivo?.startsWith("image/") &&
            !arquivo.nome_original?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i),
        )

        hasImages = imageFiles.length > 0
        hasOtherFiles = otherFiles.length > 0

        if (hasImages) {
          for (const arquivo of imageFiles) {
            try {
              checkPageBreak(100)

              // Add image title
              pdf.setFontSize(10)
              pdf.setFont("helvetica", "bold")
              pdf.text(`Imagem: ${arquivo.nome_original}`, margin, yPosition)
              yPosition += 10

              const imageBase64 = await loadImageAsBase64(arquivo)

              const tempImg = new window.Image()
              tempImg.src = imageBase64
              await new Promise((resolve) => (tempImg.onload = resolve))

              const imgWidth = tempImg.width
              const imgHeight = tempImg.height
              const maxWidth = pageWidth - margin * 2
              const maxHeight = 120

              let finalWidth = maxWidth
              let finalHeight = (imgHeight * maxWidth) / imgWidth

              if (finalHeight > maxHeight) {
                finalHeight = maxHeight
                finalWidth = (imgWidth * maxHeight) / imgHeight
              }

              if (yPosition + finalHeight > pageHeight - margin) {
                pdf.addPage()
                yPosition = margin + 40 // Account for header
              }

              pdf.addImage(imageBase64, "JPEG", margin, yPosition, finalWidth, finalHeight)
              yPosition += finalHeight + 10
            } catch (error) {
              console.error("Error embedding image:", error)
              // Continue with PDF generation even if image fails
              pdf.setFontSize(10)
              pdf.setFont("helvetica", "normal")
              pdf.text(`Erro ao carregar imagem: ${arquivo.nome_original}`, margin, yPosition)
              yPosition += 15
            }
          }
        }
      }

      checkPageBreak(30)

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.setTextColor(0, 0, 0)

      let fileMessage = ""
      if (hasOtherFiles) {
        fileMessage = "*ARQUIVOS ANEXADOS CONSTAM NO SISTEMA*"
      } else if (!hasFiles) {
        fileMessage = "*ESTE ATENDIMENTO NÃO POSSUI ARQUIVOS ANEXADOS*"
      }

      if (fileMessage) {
        const messageWidth = pdf.getTextWidth(fileMessage)
        pdf.text(fileMessage, (pageWidth - messageWidth) / 2, yPosition)
      }

      // Generate filename with first two names
      const nomePartes = atendimento.nome.trim().split(" ")
      const primeirosDoisNomes = nomePartes.slice(0, 2).join("-").toUpperCase()
      const filename = `ATENDIMENTO-${primeirosDoisNomes}.pdf`

      console.log("PDF generation completed, saving as:", filename)
      pdf.save(filename)
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado!",
        description: `${fieldName} copiado para a área de transferência`,
      })
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto",
        variant: "destructive",
      })
    }
  }

  const fetchAtendentes = async () => {
    try {
      const { data, error } = await supabase.from("vendedores").select("*").order("nome", { ascending: true })

      if (error) throw error
      setAtendentes(data || [])
    } catch (error) {
      console.error("Erro ao buscar atendentes:", error)
    }
  }

  const handleAddVendor = async () => {
    if (!newVendorName.trim() || !newVendorPhone.trim()) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("vendedores").insert([
        {
          nome: newVendorName.trim(),
          telefone: newVendorPhone.trim(),
        },
      ])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Vendedor adicionado com sucesso",
      })

      setNewVendorName("")
      setNewVendorPhone("")
      setShowAddVendorModal(false)
      fetchAtendentes()
    } catch (error) {
      console.error("Erro ao adicionar vendedor:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar vendedor",
        variant: "destructive",
      })
    }
  }

  const handleCopyAtendimentoLink = async (atendimento: any) => {
    const baseUrl = window.location.origin
    const atendimentoUrl = `${baseUrl}/dashboard/historico?atendimento=${atendimento.id}`

    try {
      await navigator.clipboard.writeText(atendimentoUrl)
      toast({
        title: "Link copiado!",
        description: "Link do atendimento foi copiado para a área de transferência",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      })
    }
  }

  const handleForwardToWhatsApp = async (atendimento: any, vendedor: any) => {
    try {
      // Generate PDF first
      await generateAtendimentoPDF(atendimento)

      const baseUrl = window.location.origin
      const atendimentoUrl = `${baseUrl}/dashboard/historico?atendimento=${atendimento.id}`

      const message = `*Novo Atendimento!*

Número do atendimento: ${atendimento.num_order ?? atendimento.id}
Nome: ${atendimento.nome}
Cidade: ${atendimento.cidade}

Confira o atendimento completo em: ${atendimentoUrl}`

      const phoneNumber = vendedor?.telefone?.replace(/\D/g, "") || ""

      if (!phoneNumber) {
        toast({
          title: "Erro",
          description: "Número de telefone do atendente não encontrado",
          variant: "destructive",
        })
        return
      }

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")

      toast({
        title: "Sucesso!",
        description: "WhatsApp aberto com a mensagem preparada",
      })
    } catch (error) {
      console.error("Erro ao encaminhar:", error)
      toast({
        title: "Erro",
        description: "Erro ao preparar mensagem para WhatsApp",
        variant: "destructive",
      })
    }
  }

  const fetchAtendimentos = async () => {
    try {
      const { data, error } = await supabase.from("atendimentos").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar atendimentos:", error)
      } else {
        setAtendimentos(data || [])
        setFilteredAtendimentos(data || [])
      }
    } catch (error) {
      console.error("Erro ao buscar atendimentos:", error)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro ao buscar usuário:", userError)
        return
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError)
        } else {
          setUserProfile(profile)
        }
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    }
  }

  useEffect(() => {
    const fetchDataWithRetry = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Erro ao buscar usuário:", userError)
          throw new Error("Erro de autenticação")
        }

        if (user) {
          await new Promise((resolve) => setTimeout(resolve, 100))

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, nome, email, nickname, tipo_usuario, ativo")
            .eq("id", user.id)
            .single()

          if (profileError) {
            console.error("Erro ao buscar perfil:", profileError)
          } else if (profile) {
            setUserProfile(profile)
          }
        }

        let retryCount = 0
        const maxRetries = 2
        let data = null
        let error = null

        while (retryCount < maxRetries) {
          try {
            if (retryCount > 0) {
              await new Promise((resolve) => setTimeout(resolve, 2000 + retryCount * 3000))
            }

            const result = await supabase
              .from("atendimentos")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(100)

            data = result.data
            error = result.error

            if (!error) break

            if (error.message?.includes("rate limit") || error.message?.includes("Too Many")) {
              retryCount++
              if (retryCount < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, Math.pow(3, retryCount) * 2000))
                continue
              }
            } else {
              break
            }
          } catch (fetchError: any) {
            console.error(`Tentativa ${retryCount + 1} falhou:`, fetchError)
            if (fetchError.message?.includes("rate limit") || fetchError.message?.includes("Too Many")) {
              retryCount++
              if (retryCount < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, Math.pow(3, retryCount) * 2000))
                continue
              }
            }
            error = fetchError
            break
          }
        }

        if (error) {
          console.error("Erro ao buscar atendimentos:", error)
          if (error.message?.includes("rate limit") || error.message?.includes("Too Many")) {
            throw new Error("Muitas requisições. Aguarde 30 segundos antes de tentar novamente.")
          } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
            throw new Error("Erro de conexão. Verifique sua internet.")
          } else {
            throw new Error("Erro ao carregar atendimentos. Tente recarregar a página.")
          }
        } else {
          console.log("Atendimentos carregados:", data?.length || 0)

          const atendimentosComArquivos = (data || []).map((atendimento) => ({
            ...atendimento,
            arquivos: atendimento.arquivos || [],
          }))

          setAtendimentos(atendimentosComArquivos)
          setFilteredAtendimentos(atendimentosComArquivos)
        }

        const searchFromUrl = searchParams.get("search")
        if (searchFromUrl) {
          setSearchTerm(searchFromUrl)
        }

        await fetchAtendentes()
      } catch (error: any) {
        console.error("Erro geral ao buscar atendimentos:", error)
        showMessage(error.message || "Erro ao carregar dados. Tente recarregar a página.", "error")
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchDataWithRetry, 500)

    return () => clearTimeout(timeoutId)
  }, []) // Removed searchParams from dependency array to prevent infinite loop

  useEffect(() => {
    if (!atendimentos.length) return

    let filtered = atendimentos

    if (searchTerm) {
      filtered = filtered.filter((atendimento) => {
        const term = searchTerm.toLowerCase()
        const nomeMatch = atendimento.nome && atendimento.nome.toLowerCase().includes(term)
        const telefoneMatch = atendimento.telefone && atendimento.telefone.includes(searchTerm)
        const cidadeMatch = atendimento.cidade && atendimento.cidade.toLowerCase().includes(term)
        const vendedorMatch = atendimento.vendedor && atendimento.vendedor.toLowerCase().includes(term)

        return nomeMatch || telefoneMatch || cidadeMatch || vendedorMatch
      })
    }

    if (statusFilter !== "todos") {
      filtered = filtered.filter((atendimento) => atendimento.status === statusFilter)
    }

    if (dateFilter !== "todos") {
      filtered = filterByDate(filtered, dateFilter)
    }

    if (startDate || endDate) {
      filtered = filterByDateRange(filtered)
    }

    setFilteredAtendimentos(filtered)
  }, [atendimentos, searchTerm, statusFilter, dateFilter, startDate, endDate])

  const handleStatusChange = async (atendimentoId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("atendimentos").update({ status: newStatus }).eq("id", atendimentoId)

      if (error) {
        console.error("Erro ao atualizar status:", error)
        if (error.message?.includes("rate limit") || error.message?.includes("Too Many")) {
          showMessage("Muitas requisições. Tente novamente em alguns segundos.", "error")
        } else {
          showMessage("Erro ao atualizar status. Tente novamente.", "error")
        }
        return
      }

      setAtendimentos((prev) =>
        prev.map((atendimento) =>
          atendimento.id === atendimentoId ? { ...atendimento, status: newStatus } : atendimento,
        ),
      )
      setEditingStatus(null)
      showMessage("Status atualizado com sucesso!", "success")
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error)
      showMessage("Erro de conexão. Verifique sua internet.", "error")
    }
  }

  const handleDeleteAtendimento = async (id: string) => {
    try {
      const { error } = await supabase.from("atendimentos").delete().eq("id", id)

      if (error) {
        console.error("Erro ao deletar atendimento:", error)
        if (error.message?.includes("rate limit") || error.message?.includes("Too Many")) {
          showMessage("Muitas requisições. Tente novamente em alguns segundos.", "error")
        } else {
          showMessage("Erro ao remover atendimento. Tente novamente.", "error")
        }
      } else {
        setAtendimentos((prev) => prev.filter((atendimento) => atendimento.id !== id))
        showMessage("Atendimento removido com sucesso!", "success")
      }
    } catch (error: any) {
      console.error("Erro ao deletar atendimento:", error)
      showMessage("Erro de conexão. Verifique sua internet.", "error")
    }
  }

  const handleEditAtendimento = (atendimento: Atendimento) => {
    setEditingAtendimento(atendimento.id)
    setEditFormData({
      nome: atendimento.nome,
      telefone: atendimento.telefone,
      cidade: atendimento.cidade,
      endereco: atendimento.endereco,
      observacoes: atendimento.observacoes || "",
      vendedor: atendimento.vendedor,
    })
    setEditingFiles(atendimento.arquivos || [])
    setNewFiles([])
  }

  const handleRemoveFile = async (arquivo: AtendimentoArquivo) => {
    try {
      // Remove from storage
      const { error: storageError } = await supabase.storage.from("atendimento-arquivos").remove([arquivo.nome_arquivo])

      if (storageError) {
        console.error("Erro ao remover do storage:", storageError)
      }

      // Get current atendimento to update arquivos array
      const atendimentoToUpdate = filteredAtendimentos.find((a) => editingFiles.some((f) => f.id === arquivo.id))

      if (!atendimentoToUpdate) {
        showMessage("Erro: Atendimento não encontrado", "error")
        return
      }

      // Remove file from arquivos array
      const currentArquivos = atendimentoToUpdate.arquivos || []
      const updatedArquivos = currentArquivos.filter((f: any) => f.id !== arquivo.id)

      // Update database with new arquivos array
      const { error: dbError } = await supabase
        .from("atendimentos")
        .update({ arquivos: updatedArquivos })
        .eq("id", atendimentoToUpdate.id)

      if (dbError) {
        console.error("Erro ao remover do banco:", dbError)
        showMessage("Erro ao remover arquivo", "error")
        return
      }

      // Update local state
      setEditingFiles((prev) => prev.filter((f) => f.id !== arquivo.id))
      showMessage("Arquivo removido com sucesso", "success")
    } catch (error) {
      console.error("Erro ao remover arquivo:", error)
      showMessage("Erro ao remover arquivo", "error")
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileArray = Array.from(files)
      setNewFiles((prev) => [...prev, ...fileArray])
    }
  }

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUploadNewFiles = async () => {
    if (!editingAtendimento || newFiles.length === 0) return

    setUploadingFiles(true)
    try {
      const uploadedFiles: any[] = []

      for (const file of newFiles) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage.from("atendimento-arquivos").upload(fileName, file)

        if (uploadError) {
          console.error("Erro no upload:", uploadError)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("atendimento-arquivos").getPublicUrl(fileName)

        const fileRecord = {
          nome_arquivo: fileName,
          nome_original: file.name,
          tamanho_arquivo: file.size,
          tipo_arquivo: file.type,
          url: publicUrl,
        }

        uploadedFiles.push(fileRecord)
      }

      const currentFiles = editingFiles || []
      const updatedFiles = [...currentFiles, ...uploadedFiles]

      const { error: updateError } = await supabase
        .from("atendimentos")
        .update({ arquivos: updatedFiles })
        .eq("id", editingAtendimento)

      if (updateError) {
        console.error("Erro ao atualizar arquivos:", updateError)
        showMessage("Erro ao salvar arquivos no banco de dados", "error")
        return
      }

      setEditingFiles(updatedFiles)
      setNewFiles([])
      showMessage(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`, "success")
    } catch (error) {
      console.error("Erro no upload:", error)
      showMessage("Erro ao enviar arquivos", "error")
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleSaveEditedAtendimento = async () => {
    if (!editingAtendimento || !editFormData) return

    try {
      const { error } = await supabase
        .from("atendimentos")
        .update({
          nome: editFormData.nome,
          telefone: editFormData.telefone,
          cidade: editFormData.cidade,
          endereco: editFormData.endereco,
          observacoes: editFormData.observacoes,
          atendente: editFormData.atendente,
          arquivos: editingFiles,
        })
        .eq("id", editingAtendimento)

      if (error) {
        console.error("Erro ao atualizar atendimento:", error)
        showMessage("Erro ao atualizar atendimento. Tente novamente.", "error")
        return
      }

      // Update local state
      setAtendimentos((prev) =>
        prev.map((atendimento) =>
          atendimento.id === editingAtendimento
            ? { ...atendimento, ...editFormData, arquivos: editingFiles }
            : atendimento,
        ),
      )

      setEditingAtendimento(null)
      setEditFormData({})
      setEditingFiles([])
      setNewFiles([])
      showMessage("Atendimento atualizado com sucesso!", "success")
    } catch (error: any) {
      console.error("Erro ao atualizar atendimento:", error)
      showMessage("Erro de conexão. Verifique sua internet.", "error")
    }
  }

  const showMessage = (message: string, type: "success" | "error", onConfirm: (() => void) | null = null) => {
    setModalMessage(message)
    setModalType(type)
    setConfirmCallback(() => onConfirm)
    setShowModal(true)
  }

  const handleConfirm = () => {
    if (confirmCallback) {
      confirmCallback()
    }
    setShowModal(false)
    setConfirmCallback(null)
  }

  const handleCancel = () => {
    setShowModal(false)
    setConfirmCallback(null)
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

  const isAdmin = () => {
    return userProfile?.tipo_usuario === "administrador"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-600 text-white border-yellow-600"
      case "concluido":
        return "bg-green-600 text-white border-green-600"
      case "cancelado":
        return "bg-red-600 text-white border-red-600"
      default:
        return "bg-gray-600 text-white border-gray-600"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente"
      case "concluido":
        return "Concluído"
      case "cancelado":
        return "Cancelado"
      default:
        return status
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

  const toggleAtendimento = (id: string) => {
    const newExpanded = new Set(expandedAtendimentos)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedAtendimentos(newExpanded)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-blue)] via-[var(--primary-blue-medium)] to-[var(--secondary-blue)] p-4 sm:p-6 lg:p-8 rounded-2xl my-7 bg-slate-500 lg:py-8">
      <div className="space-y-4 sm:space-y-6">
        <div className="pt-6 sm:pt-8">
          <div className="glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6 my-0 flex-col">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--primary-blue-dark)] mb-2">
              Histórico Completo
            </h1>
          </div>
        </div>

        <div className="glass-effect rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--primary-blue-dark)]/60"
                  size={18}
                />
                <Input
                  placeholder="Buscar por nome, telefone, cidade ou vendedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-[var(--primary-blue-dark)] text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm sm:text-base">
                  <Filter size={16} className="mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--primary-blue-dark)] border-white/20">
                  <SelectItem
                    value="todos"
                    className="text-white hover:bg-[var(--secondary-blue)] hover:text-white focus:bg-[var(--secondary-blue)] focus:text-white font-semibold"
                  >
                    Todos os Status
                  </SelectItem>
                  <SelectItem
                    value="pendente"
                    className="text-white hover:bg-[var(--secondary-blue)] hover:text-white focus:bg-[var(--secondary-blue)] focus:text-white font-semibold"
                  >
                    Pendente
                  </SelectItem>
                  <SelectItem
                    value="concluido"
                    className="text-white hover:bg-[var(--secondary-blue)] hover:text-white focus:bg-[var(--secondary-blue)] focus:text-white font-semibold"
                  >
                    Concluído
                  </SelectItem>
                  <SelectItem
                    value="cancelado"
                    className="text-white hover:bg-[var(--secondary-blue)] hover:text-white focus:bg-[var(--secondary-blue)] focus:text-white font-semibold"
                  >
                    Cancelado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setDateFilter("hoje")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                dateFilter === "hoje"
                  ? "bg-[var(--primary-blue-dark)] text-white shadow-lg"
                  : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
              }`}
            >
              Hoje
            </button>
            <span className="text-white/60 self-center">|</span>
            <button
              onClick={() => setDateFilter("semana")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                dateFilter === "semana"
                  ? "bg-[var(--primary-blue-dark)] text-white shadow-lg"
                  : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
              }`}
            >
              Esta Semana
            </button>
            <span className="text-white/60 self-center">|</span>
            <button
              onClick={() => setDateFilter("mes")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                dateFilter === "mes"
                  ? "bg-[var(--primary-blue-dark)] text-white shadow-lg"
                  : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
              }`}
            >
              Este Mês
            </button>
            {dateFilter !== "todos" && (
              <>
                <span className="text-white/60 self-center">|</span>
                <button
                  onClick={() => setDateFilter("todos")}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                >
                  Limpar Filtro
                </button>
              </>
            )}

            <div className="flex gap-2 ml-auto">
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Data Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white focus:border-[var(--primary-blue-dark)] focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-white/80 mb-1">Data Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white focus:border-[var(--primary-blue-dark)] focus:outline-none"
                />
              </div>
              {(startDate || endDate) && (
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => {
                      setStartDate("")
                      setEndDate("")
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-white font-semibold">
            Mostrando {filteredAtendimentos.length} de {atendimentos.length} atendimentos
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {filteredAtendimentos && filteredAtendimentos.length > 0 ? (
            filteredAtendimentos.map((atendimento) => {
              const isExpanded = expandedAtendimentos.has(atendimento.id)
              const cardColor = getStatusCardColor(atendimento.status)

              return (
                <Card
                  key={atendimento.id}
                  className={`${cardColor} shadow-xl border-white/20 hover:opacity-90 transition-all duration-300 cursor-pointer w-full max-w-full overflow-hidden`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleAtendimento(atendimento.id)
                  }}
                >
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <CardTitle className="text-lg sm:text-xl font-black text-white break-words">
                            <span
                              className={`inline-flex items-center justify-center ${
                                atendimento.status === "concluido" ? "bg-green-800" : atendimento.status === "cancelado" ? "bg-red-800" : "bg-blue-600"
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
                      
                      {/* Ajuste para mobile: botões abaixo do nome em telas pequenas */}
                      <div className="hidden sm:flex items-center gap-2">
                        <Select onValueChange={(value) => handleStatusChange(atendimento.id, value)}>
                          <SelectTrigger className="w-[120px] bg-transparent border-none text-white hover:bg-white/10 text-xs h-8">
                            <SelectValue placeholder="Status">{getStatusLabel(atendimento.status)}</SelectValue>
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
                            handleEditAtendimento(atendimento)
                          }}
                          className="h-8 w-8 text-white hover:bg-white/10"
                          title="Editar atendimento"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            generateAtendimentoPDF(atendimento)
                          }}
                          className="h-8 w-8 text-white hover:bg-white/10"
                          title="Gerar PDF"
                        >
                          <File size={16} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 text-white hover:bg-red-500/20"
                              title="Excluir atendimento"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[var(--primary-blue-dark)] border-white/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-white/80">
                                Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAtendimento(atendimento.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleAtendimento(atendimento.id)
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
                    
                    {/* Botões para mobile - aparecem abaixo do nome */}
                    <div className="sm:hidden mt-3 flex flex-wrap items-center gap-2">
                      <Select onValueChange={(value) => handleStatusChange(atendimento.id, value)}>
                        <SelectTrigger className="w-[100px] bg-transparent border border-white/20 text-white hover:bg-white/10 text-xs h-8">
                          <SelectValue placeholder="Status" className="text-xs">{getStatusLabel(atendimento.status)}</SelectValue>
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
                          handleEditAtendimento(atendimento)
                        }}
                        className="h-8 w-8 text-white hover:bg-white/10"
                        title="Editar atendimento"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          generateAtendimentoPDF(atendimento)
                        }}
                        className="h-8 w-8 text-white hover:bg-white/10"
                        title="Gerar PDF"
                      >
                        <File size={16} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 text-white hover:bg-red-500/20"
                            title="Excluir atendimento"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[var(--primary-blue-dark)] border-white/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/80">
                              Tem certeza que deseja excluir este atendimento? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAtendimento(atendimento.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleAtendimento(atendimento.id)
                        }}
                        className="h-6 w-6 text-white hover:bg-white/10 transition-transform duration-200 ml-auto"
                        title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 border-t border-white/10 w-full overflow-x-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                        <div className="space-y-1 w-full overflow-hidden">
                          <div className="flex items-center gap-2 w-full">
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
                            <span className="font-black text-white text-sm sm:text-base lg:text-lg flex-shrink-0">Telefone:</span>
                            <span className="text-white text-sm sm:text-base lg:text-lg break-all flex-1 min-w-0 overflow-hidden">
                              {atendimento.telefone}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 w-full overflow-hidden">
                          <div className="flex items-center gap-2 w-full">
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
                            <span className="font-black text-white text-sm sm:text-base lg:text-lg flex-shrink-0">Cidade:</span>
                            <span className="text-white text-sm sm:text-base lg:text-lg break-words flex-1 min-w-0 overflow-hidden">
                              {atendimento.cidade}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 w-full overflow-hidden">
                        <div className="flex items-center justify-between w-full">
                          <h4 className="text-white font-black mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg flex-1 min-w-0">
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
                        <p className="text-white/80 text-sm sm:text-base break-words w-full overflow-hidden">{atendimento.nome}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 w-full overflow-hidden">
                        <div className="flex items-center justify-between w-full">
                          <h4 className="text-white font-black mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg flex-1 min-w-0">
                            📍 Endereço
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(atendimento.endereco, "Endereço")
                            }}
                            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            title="Copiar endereço"
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                        <p className="text-white/80 text-sm sm:text-base break-words w-full overflow-hidden">{atendimento.endereco}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 w-full overflow-hidden">
                        <h4 className="text-white font-black mb-1 sm:mb-2 text-sm sm:text-base lg:text-lg">
                          👤 Atendente
                        </h4>
                        <p className="text-white/80 text-sm sm:text-base break-words w-full overflow-hidden">{atendimento.atendente}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10 w-full overflow-hidden">
                        <div className="flex items-center justify-between mb-1 sm:mb-2 w-full">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <MessageSquare size={16} className="text-white flex-shrink-0" />
                            <h4 className="text-white font-black text-sm sm:text-base lg:text-lg">Observações</h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(atendimento.observacoes, "Observações")
                            }}
                            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10 flex-shrink-0"
                            title="Copiar observações"
                          >
                            <Copy size={12} />
                          </Button>
                        </div>
                        <p className="text-white/80 text-sm sm:text-base whitespace-pre-wrap break-words w-full overflow-hidden">{atendimento.observacoes}</p>
                      </div>

                      {atendimento.arquivos && atendimento.arquivos.length > 0 && (
                        <div className="mt-4 w-full overflow-hidden">
                          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                            <Paperclip size={16} />
                            Arquivos Anexados ({atendimento.arquivos.length})
                          </h4>
                          <div className="space-y-2 w-full">
                            {atendimento.arquivos.map((arquivo, index) => (
                              <div
                                key={`${atendimento.id}-${index}`}
                                className="flex items-center justify-between bg-white/10 rounded-lg p-2 sm:p-3 w-full overflow-hidden"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                  <File size={16} className="text-white/60 flex-shrink-0" />
                                  <div className="min-w-0 flex-1 overflow-hidden">
                                    <p className="text-white text-sm truncate w-full">{arquivo.nome_original}</p>
                                    <p className="text-white/60 text-xs">
                                      {formatFileSize(arquivo.tamanho_arquivo)} •{" "}
                                      {arquivo.created_at
                                        ? new Date(arquivo.created_at).toLocaleDateString("pt-BR")
                                        : "Data não disponível"}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadFile(arquivo)
                                  }}
                                  className="text-white hover:bg-white/20 flex-shrink-0"
                                >
                                  <DownloadIcon size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-right w-full">
                        <p className="text-white text-xs sm:text-sm">
                          Criado em{" "}
                          <span className="text-white">
                            {new Date(atendimento.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </p>
                      </div>

                      <div className="border-t border-white/10 pt-4 mt-4 w-full overflow-hidden">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1 min-w-0">
                            <div className="relative">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowAtendenteMenu(showAtendenteMenu === atendimento.id ? null : atendimento.id)
                                }}
                                className={`text-white hover:bg-white/10 text-sm ${
                                  selectedAtendente ? "bg-green-600 hover:bg-green-700" : ""
                                }`}
                              >
                                {selectedAtendente ? selectedAtendente.nome : "Selecionar Vendedor"}
                                <ChevronDown size={16} className="ml-2" />
                              </Button>

                              {showAtendenteMenu === atendimento.id && (
                                <div className="absolute bottom-full left-0 mb-2 bg-[var(--primary-blue-dark)] border border-white/20 rounded-lg shadow-xl z-50 min-w-48">
                                  <div className="p-2 max-h-40 overflow-y-auto">
                                    {atendentes.length > 0 ? (
                                      atendentes.map((atendente) => (
                                        <button
                                          key={atendente.id}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedAtendente(atendente)
                                            setShowAtendenteMenu(null)
                                          }}
                                          className="w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded text-sm"
                                        >
                                          {atendente.nome}
                                        </button>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-white/60 text-sm">Nenhum vendedor encontrado</div>
                                    )}
                                  </div>
                                  <div className="border-t border-white/20 p-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowAddVendorModal(true)
                                        setShowAtendenteMenu(null)
                                      }}
                                      className="w-full text-left px-3 py-2 text-green-400 hover:bg-white/10 rounded text-sm flex items-center gap-2"
                                    >
                                      <Plus size={14} />
                                      Adicionar Vendedor
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCopyAtendimentoLink(atendimento)
                              }}
                              className="text-white hover:bg-white/10 text-sm"
                            >
                              <Link size={16} className="mr-2" />
                              Copiar Link
                            </Button>

                            {selectedAtendente && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleForwardToWhatsApp(atendimento, selectedAtendente)
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm"
                              >
                                <Send size={16} className="mr-2" />
                                Encaminhar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          ) : (
            <div className="text-center py-12">
              <div className="glass-effect rounded-xl p-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-white/60 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum atendimento encontrado</h3>
                <p className="text-white/80">
                  {searchTerm || statusFilter !== "todos" || dateFilter !== "todos" || startDate || endDate
                    ? "Tente ajustar os filtros para encontrar atendimentos."
                    : "Ainda não há atendimentos cadastrados no sistema."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--primary-blue-dark)] rounded-lg p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              {modalType === "success" ? (
                <CheckCircle className="text-green-400" size={24} />
              ) : (
                <AlertCircle className="text-red-400" size={24} />
              )}
              <h3 className="text-lg font-semibold text-white">
                {modalType === "success" ? "Sucesso" : "Erro"}
              </h3>
            </div>
            <p className="text-white/80 mb-6">{modalMessage}</p>
            <div className="flex gap-3 justify-end">
              {confirmCallback && (
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  Cancelar
                </Button>
              )}
              <Button
                onClick={handleConfirm}
                className={`${
                  modalType === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white`}
              >
                {confirmCallback ? "Confirmar" : "OK"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de adicionar vendedor */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--primary-blue-dark)] rounded-lg p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Adicionar Vendedor</h3>
              <Button
                onClick={() => setShowAddVendorModal(false)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <X size={20} />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Nome</label>
                <Input
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="Nome do vendedor"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">Telefone</label>
                <Input
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  placeholder="Telefone do vendedor"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                onClick={() => setShowAddVendorModal(false)}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddVendor}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de atendimento */}
      {editingAtendimento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[var(--primary-blue-dark)] rounded-lg p-6 max-w-2xl w-full border border-white/20 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Editar Atendimento</h3>
              <Button
                onClick={() => {
                  setEditingAtendimento(null)
                  setEditFormData({})
                  setEditingFiles([])
                  setNewFiles([])
                }}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <X size={20} />
              </Button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Nome</label>
                  <Input
                    value={editFormData.nome || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Telefone</label>
                  <Input
                    value={editFormData.telefone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Cidade</label>
                  <Input
                    value={editFormData.cidade || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Endereço</label>
                  <Input
                    value={editFormData.endereco || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Observações</label>
                <textarea
                  value={editFormData.observacoes || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/60 focus:border-[var(--primary-blue-dark)] focus:outline-none resize-none"
                />
              </div>

              {/* Arquivos existentes */}
              {editingFiles.length > 0 && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Arquivos Atuais</label>
                  <div className="space-y-2">
                    {editingFiles.map((arquivo, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File size={16} className="text-white/60 flex-shrink-0" />
                          <span className="text-white text-sm truncate">{arquivo.nome_original}</span>
                        </div>
                        <Button
                          onClick={() => handleRemoveFile(arquivo)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/20 flex-shrink-0"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload de novos arquivos */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Adicionar Novos Arquivos</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30"
                />
                
                {newFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <File size={16} className="text-white/60 flex-shrink-0" />
                          <span className="text-white text-sm truncate">{file.name}</span>
                        </div>
                        <Button
                          onClick={() => handleRemoveNewFile(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/20 flex-shrink-0"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={handleUploadNewFiles}
                      disabled={uploadingFiles}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {uploadingFiles ? (
                        <>
                          <Upload className="animate-spin mr-2" size={16} />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2" size={16} />
                          Enviar Arquivos
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/20">
              <Button
                onClick={() => {
                  setEditingAtendimento(null)
                  setEditFormData({})
                  setEditingFiles([])
                  setNewFiles([])
                }}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEditedAtendimento}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
