"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, ImageIcon, X, Plus, Edit, Trash2, FolderPlus, AlertCircle, CheckCircle, Pin } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DndContext, useSensor, useSensors, PointerSensor, closestCenter } from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "@/components/ui/use-toast"

interface PortfolioItem {
  id: string
  titulo: string
  descricao: string
  imagem_principal: string
  galeria: string[]
  secao: string
  cores: string[]
  ativo: boolean
  ordem: number
  fixado?: boolean
}

interface Secao {
  nome: string
  titulo_exibicao: string
  ordem: number
  icone: string
}

const SortableItem = ({ item, onEdit, onDelete, onTogglePin }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-4 p-4 bg-white/10 rounded-lg border border-white/20 hover:border-white/40 transition-colors cursor-grab"
    >
      <img
        src={item.imagem_principal || "/placeholder.svg"}
        alt={item.titulo}
        className="w-16 h-16 object-cover rounded-lg"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold mb-1 truncate">{item.titulo}</h3>
        <p className="text-white/70 text-sm mb-1 truncate">{item.descricao}</p>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <span>{item.secao}</span>
          <span>•</span>
          <span>
            {new Date(item.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
          {item.cores && item.cores.length > 0 && (
            <>
              <span>•</span>
              <span>{item.cores.length} cores</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTogglePin(item.id, !item.fixado)}
          className={`p-2 rounded-lg transition-colors ${
            item.fixado
              ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
              : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
          }`}
          title={item.fixado ? "Desafixar item" : "Fixar item"}
        >
          <Pin size={16} />
        </button>
        <button
          onClick={() => onEdit(item)}
          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
          title="Editar item"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          title="Remover item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

const SortableSectionButton = ({ secao, activeTab, setActiveTab }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: secao.nome })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setActiveTab(secao.nome)}
      className={`py-2 px-4 rounded-full transition-colors font-medium cursor-grab ${
        activeTab === secao.nome ? "bg-blue-600 text-white shadow-md" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
      }`}
    >
      {secao.titulo_exibicao}
    </button>
  )
}

export default function AdicionarItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalType, setModalType] = useState<"success" | "error">("success")
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [secoes, setSecoes] = useState<Secao[]>([])
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState<File | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null)

  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [secao, setSecao] = useState("")
  const [imagemPrincipal, setImagemPrincipal] = useState<File | null>(null)
  const [existingImagemPrincipalUrl, setExistingImagemPrincipalUrl] = useState<string | null>(null)
  const [galeria, setGaleria] = useState<File[]>([])
  const [existingGaleriaUrls, setExistingGaleriaUrls] = useState<string[]>([])
  const [cores, setCores] = useState<string[]>([])
  const [novaCor, setNovaCor] = useState("")
  const [activeTab, setActiveTab] = useState<string>("")
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    fetchSections()
    fetchItems()
  }, [])

  useEffect(() => {
    if (activeTab) {
      const filtered = items.filter((item) => item.secao === activeTab)
      filtered.sort((a, b) => a.ordem - b.ordem)
      setFilteredItems(filtered)
    } else {
      const sortedItems = [...items].sort((a, b) => a.ordem - b.ordem)
      setFilteredItems(sortedItems)
    }
  }, [activeTab, items])

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase.from("secoes").select("*").order("ordem", { ascending: true })

      if (error) {
        console.error("Erro ao buscar seções:", error)
        showMessage("Erro ao carregar seções", "error")
      } else {
        setSecoes(data || [])
        if (data.length > 0 && !activeTab) {
          setActiveTab(data[0].nome)
        }
      }
    } catch (error) {
      console.error("Erro geral ao buscar seções:", error)
      showMessage("Erro inesperado ao carregar seções", "error")
    }
  }

  const fetchItems = async () => {
    try {
      setLoadingItems(true)
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar itens:", error)
        showMessage("Erro ao carregar itens do portfólio", "error")
      } else {
        const itemsWithOrdem = data.map((item, index) => ({
          ...item,
          ordem: item.ordem ?? index,
        }))
        setItems(itemsWithOrdem || [])
      }
    } catch (error) {
      console.error("Erro geral ao buscar itens:", error)
      showMessage("Erro inesperado ao carregar itens", "error")
    } finally {
      setLoadingItems(false)
    }
  }

  const showMessage = (message: string, type: "success" | "error") => {
    setModalMessage(message)
    setModalType(type)
    setShowModal(true)
  }

  const uploadFile = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { data, error } = await supabase.storage.from("media").upload(fileName, file)

      if (error) {
        console.error("Erro no upload:", error)
        return null
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Erro geral no upload:", error)
      return null
    }
  }

  const handleImagemPrincipalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagemPrincipal(e.target.files[0])
      setExistingImagemPrincipalUrl(null)
    }
  }

  const removeImagemPrincipal = () => {
    setImagemPrincipal(null)
    setExistingImagemPrincipalUrl(null)
  }

  const handleGaleriaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setGaleria((prev) => [...prev, ...newImages])
    }
  }

  const removeGaleriaFile = (index: number) => {
    setGaleria((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingGaleriaImage = (index: number) => {
    setExistingGaleriaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const adicionarCor = () => {
    if (novaCor.trim() && !cores.includes(novaCor.trim())) {
      setCores((prev) => [...prev, novaCor.trim()])
      setNovaCor("")
    }
  }

  const removerCor = (index: number) => {
    setCores((prev) => prev.filter((_, i) => i !== index))
  }

  const clearForm = () => {
    setTitulo("")
    setDescricao("")
    setSecao("")
    setImagemPrincipal(null)
    setExistingImagemPrincipalUrl(null)
    setGaleria([])
    setExistingGaleriaUrls([])
    setCores([])
    setNovaCor("")
    setEditingItem(null)
    setNewCategoryIcon(null)
    setIconPreview(null)
  }

  const editItem = (item: PortfolioItem) => {
    setEditingItem(item)
    setTitulo(item.titulo)
    setDescricao(item.descricao)
    setSecao(item.secao)
    setCores(item.cores || [])

    setExistingImagemPrincipalUrl(item.imagem_principal)
    setExistingGaleriaUrls(item.galeria || [])

    setImagemPrincipal(null)
    setGaleria([])
    setActiveTab(item.secao)
  }

  const deleteItem = (itemId: string) => {
    setItemToDeleteId(itemId)
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return

    setShowDeleteConfirmModal(false)

    try {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", itemToDeleteId)

      if (error) {
        console.error("Erro ao remover item:", error)
        showMessage("Erro ao remover item do portfólio", "error")
        return
      }

      setItems((prev) => prev.filter((item) => item.id !== itemToDeleteId))
      showMessage("Item removido com sucesso!", "success")
      setItemToDeleteId(null)
    } catch (error) {
      console.error("Erro geral ao remover item:", error)
      showMessage("Erro inesperado ao remover item", "error")
    }
  }

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.includes("png")) {
      showMessage("Apenas arquivos PNG são aceitos", "error")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage("O arquivo deve ter no máximo 2MB", "error")
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      if (img.width !== 64 || img.height !== 64) {
        showMessage("O ícone deve ter exatamente 64x64 pixels", "error")
        URL.revokeObjectURL(url)
        return
      }

      setNewCategoryIcon(file)
      setIconPreview(url)
    }

    img.onerror = () => {
      showMessage("Erro ao carregar a imagem", "error")
      URL.revokeObjectURL(url)
    }

    img.src = url
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      showMessage("Por favor, digite o nome da categoria", "error")
      return
    }

    const categoryValue = newCategoryName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    if (secoes.some((s) => s.nome === categoryValue)) {
      showMessage("Esta categoria já existe", "error")
      return
    }

    try {
      let iconUrl = null

      if (newCategoryIcon) {
        const fileName = `category-icons/${categoryValue}-${Date.now()}.png`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, newCategoryIcon)

        if (uploadError) {
          console.error("Erro ao fazer upload do ícone:", uploadError)
          showMessage("Erro ao fazer upload do ícone", "error")
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(fileName)

        iconUrl = publicUrl
      }

      const newOrdem = secoes.length > 0 ? Math.max(...secoes.map((s) => s.ordem)) + 1 : 0
      const { data, error } = await supabase
        .from("secoes")
        .insert({
          nome: categoryValue,
          titulo_exibicao: newCategoryName.trim(),
          ordem: newOrdem,
          icone: iconUrl,
        })
        .select()

      if (error) {
        console.error("Erro ao adicionar categoria:", error)
        showMessage("Erro ao adicionar a nova categoria.", "error")
        return
      }

      setSecoes((prev) => [...prev, data[0]])
      setNewCategoryName("")
      setNewCategoryIcon(null)
      setIconPreview(null)
      setShowCategoryModal(false)
      showMessage("Categoria adicionada com sucesso!", "success")
    } catch (error) {
      console.error("Erro geral ao adicionar categoria:", error)
      showMessage("Erro inesperado ao adicionar categoria", "error")
    }
  }

  const removeCategory = async (categoryValue: string) => {
    const { count, error: countError } = await supabase
      .from("portfolio_items")
      .select("*", { count: "exact" })
      .eq("secao", categoryValue)

    if (countError) {
      console.error("Erro ao verificar itens na categoria:", countError)
      showMessage("Erro ao verificar itens na categoria. Tente novamente.", "error")
      return
    }

    if (count > 0) {
      showMessage(`Não é possível remover a categoria "${categoryValue}" porque ela ainda tem ${count} itens.`, "error")
      return
    }

    try {
      const { error } = await supabase.from("secoes").delete().eq("nome", categoryValue)

      if (error) {
        console.error("Erro ao remover categoria:", error)
        showMessage("Erro ao remover a categoria.", "error")
        return
      }

      setSecoes((prev) => prev.filter((s) => s.nome !== categoryValue))
      showMessage("Categoria removida com sucesso!", "success")
    } catch (error) {
      console.error("Erro geral ao remover categoria:", error)
      showMessage("Erro inesperado ao remover categoria", "error")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim() || !descricao.trim() || !secao) {
      showMessage("Por favor, preencha todos os campos obrigatórios", "error")
      return
    }

    if (!editingItem && !imagemPrincipal) {
      showMessage("Por favor, selecione uma imagem principal", "error")
      return
    }

    setLoading(true)

    try {
      let imagemPrincipalUrl = existingImagemPrincipalUrl || ""
      let galeriaUrls: string[] = existingGaleriaUrls

      if (imagemPrincipal) {
        const url = await uploadFile(imagemPrincipal)
        if (url) {
          imagemPrincipalUrl = url
        } else {
          showMessage("Erro no upload da imagem principal", "error")
          return
        }
      }

      if (galeria.length > 0) {
        const newGaleriaUrls = []
        for (const imagem of galeria) {
          const url = await uploadFile(imagem)
          if (url) newGaleriaUrls.push(url)
        }
        galeriaUrls = [...galeriaUrls, ...newGaleriaUrls]
      }

      const itemData = {
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        secao,
        imagem_principal: imagemPrincipalUrl,
        galeria: galeriaUrls.length > 0 ? galeriaUrls : null,
        cores: cores.length > 0 ? cores : null,
      }

      if (editingItem) {
        const { error } = await supabase.from("portfolio_items").update(itemData).eq("id", editingItem.id)

        if (error) {
          console.error("Erro ao atualizar item:", error)
          showMessage("Erro ao atualizar item. Tente novamente.", "error")
          return
        }

        showMessage("Item atualizado com sucesso!", "success")
      } else {
        const maxOrdem = items.length > 0 ? Math.max(...items.map((item) => item.ordem)) : -1
        const newItemOrdem = maxOrdem + 1
        const newItemWithOrdem = { ...itemData, ordem: newItemOrdem }

        const { error } = await supabase.from("portfolio_items").insert(newItemWithOrdem)

        if (error) {
          console.error("Erro ao adicionar item:", error)
          showMessage("Erro ao adicionar item. Tente novamente.", "error")
          return
        }

        showMessage("Item adicionado com sucesso ao portfólio!", "success")
      }

      clearForm()
      fetchItems()
    } catch (error) {
      console.error("Erro geral:", error)
      showMessage("Erro inesperado. Tente novamente.", "error")
    } finally {
      setLoading(false)
    }
  }

  const saveNewItemOrdem = async (newItems: PortfolioItem[]) => {
    try {
      setLoadingItems(true)
      const updates = newItems.map((item, index) => ({
        id: item.id,
        ordem: index,
      }))

      const updatePromises = updates.map((update) =>
        supabase.from("portfolio_items").update({ ordem: update.ordem }).eq("id", update.id),
      )

      const results = await Promise.all(updatePromises)
      const hasError = results.some((result) => result.error)

      if (hasError) {
        console.error("Erro ao salvar a nova ordem:", results.find((result) => result.error)?.error)
        showMessage("Erro ao salvar a nova ordem dos itens. Tente novamente.", "error")
      } else {
        showMessage("Ordem dos itens salva com sucesso!", "success")
      }
    } catch (error) {
      console.error("Erro geral ao salvar a nova ordem:", error)
      showMessage("Erro inesperado ao salvar a ordem dos itens.", "error")
    } finally {
      setLoadingItems(false)
    }
  }

  const saveNewSectionOrdem = async (newSections: Secao[]) => {
    try {
      const updates = newSections.map((secao, index) => ({
        nome: secao.nome,
        ordem: index,
      }))

      const updatePromises = updates.map((update) =>
        supabase.from("secoes").update({ ordem: update.ordem }).eq("nome", update.nome),
      )

      const results = await Promise.all(updatePromises)
      const hasError = results.some((result) => result.error)

      if (hasError) {
        console.error("Erro ao salvar a nova ordem das seções:", results.find((result) => result.error)?.error)
        showMessage("Erro ao salvar a nova ordem das seções. Tente novamente.", "error")
      } else {
        showMessage("Ordem das seções salva com sucesso!", "success")
      }
    } catch (error) {
      console.error("Erro geral ao salvar a nova ordem das seções:", error)
      showMessage("Erro inesperado ao salvar a ordem das seções.", "error")
    }
  }

  const handleDragEndItems = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = filteredItems.findIndex((item) => item.id === active.id)
      const newIndex = filteredItems.findIndex((item) => item.id === over.id)

      const newOrderedItems = arrayMove(filteredItems, oldIndex, newIndex)

      // Update the complete items array while preserving items from other sections
      const updatedItems = items.map((item) => {
        // Find if this item is in the reordered filtered items
        const reorderedItem = newOrderedItems.find((reordered) => reordered.id === item.id)
        if (reorderedItem) {
          // Update with new order from the reordered items
          const newOrder = newOrderedItems.findIndex((reordered) => reordered.id === item.id)
          return { ...item, ordem: newOrder }
        }
        return item
      })

      setItems(updatedItems)
      setFilteredItems(newOrderedItems)

      saveNewItemOrdem(newOrderedItems)
    }
  }

  const handleDragEndSections = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = secoes.findIndex((s) => s.nome === active.id)
      const newIndex = secoes.findIndex((s) => s.nome === over.id)

      const newOrderedSections = arrayMove(secoes, oldIndex, newIndex)
      setSecoes(newOrderedSections)

      saveNewSectionOrdem(newOrderedSections)
    }
  }

  const togglePin = async (itemId: string, fixado: boolean) => {
    try {
      if (fixado) {
        const pinnedCount = items.filter((item) => item.fixado).length
        if (pinnedCount >= 3) {
          toast({
            title: "Limite atingido",
            description: "Você pode fixar no máximo 3 itens na página inicial",
            variant: "destructive",
          })
          return
        }
      }

      const { error } = await supabase.from("portfolio_items").update({ fixado }).eq("id", itemId)

      if (error) throw error

      setItems(items.map((item) => (item.id === itemId ? { ...item, fixado } : item)))

      toast({
        title: fixado ? "Item fixado" : "Item desafixado",
        description: fixado ? "Item será exibido na página inicial" : "Item removido da página inicial",
      })
    } catch (error) {
      console.error("Erro ao alterar fixação:", error)
      toast({
        title: "Erro",
        description: "Erro ao alterar fixação do item",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass-effect rounded-2xl p-6 mb-8 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-2">
              {editingItem ? "Editar Item do Portfólio" : "Adicionar Item ao Portfólio"}
            </h1>
            <p className="text-white/80">
              {editingItem
                ? "Edite as informações do projeto"
                : "Adicione um novo projeto ao portfólio da Design Vidraçaria"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">
                    <Package className="inline mr-2" size={20} />
                    Título do Projeto *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Digite o título do projeto..."
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-[var(--secondary-blue)] focus:outline-none"
                    required
                  />
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">
                    <Package className="inline mr-2" size={20} />
                    Seção *
                  </label>
                  <div className="flex gap-2 mb-3">
                    <select
                      value={secao}
                      onChange={(e) => setSecao(e.target.value)}
                      className="flex-1 p-4 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[var(--secondary-blue)] focus:outline-none"
                      required
                    >
                      <option value="" className="bg-[var(--primary-blue-dark)] text-white">
                        Selecione uma seção...
                      </option>
                      {secoes.map((secaoItem) => (
                        <option
                          key={secaoItem.nome}
                          value={secaoItem.nome}
                          className="bg-[var(--primary-blue-dark)] text-white"
                        >
                          {secaoItem.titulo_exibicao}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      title="Adicionar categoria"
                    >
                      <FolderPlus size={20} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {secoes.map((secaoItem) => (
                      <div key={secaoItem.nome} className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1">
                        <span className="text-white text-sm">{secaoItem.titulo_exibicao}</span>
                        <button
                          type="button"
                          onClick={() => removeCategory(secaoItem.nome)}
                          className="text-red-400 hover:text-red-300 ml-1"
                          title="Remover categoria"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">
                    <Package className="inline mr-2" size={20} />
                    Descrição *
                  </label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva o projeto..."
                    rows={6}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-[var(--secondary-blue)] focus:outline-none resize-vertical"
                    required
                  />
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">
                    <ImageIcon className="inline mr-2" size={20} />
                    Imagem Principal {!editingItem && "*"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagemPrincipalUpload}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--secondary-blue)] file:text-white hover:file:bg-[var(--primary-blue-dark)]"
                  />

                  {(imagemPrincipal || existingImagemPrincipalUrl) && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="relative">
                        <img
                          src={
                            imagemPrincipal
                              ? URL.createObjectURL(imagemPrincipal)
                              : existingImagemPrincipalUrl || "/placeholder.svg"
                          }
                          alt="Preview da imagem principal"
                          className="w-full max-w-md h-48 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-white/80 bg-white/10 rounded-lg p-2 max-w-fit">
                        <span className="text-sm">
                          {imagemPrincipal ? imagemPrincipal.name : existingImagemPrincipalUrl.split("/").pop()}
                        </span>
                        <button
                          type="button"
                          onClick={removeImagemPrincipal}
                          className="text-red-400 hover:text-red-300 ml-1"
                          title="Remover imagem principal"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">
                    <ImageIcon className="inline mr-2" size={20} />
                    Galeria de Imagens (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGaleriaUpload}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--secondary-blue)] file:text-white hover:file:bg-[var(--primary-blue-dark)]"
                  />

                  {(galeria.length > 0 || existingGaleriaUrls.length > 0) && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                      {existingGaleriaUrls.map((url, index) => (
                        <div key={`existing-${index}`} className="relative">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Preview galeria ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 text-white rounded-lg px-2 py-1">
                            <span className="text-xs truncate max-w-[calc(100%-20px)]">{url.split("/").pop()}</span>
                            <button
                              type="button"
                              onClick={() => removeExistingGaleriaImage(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {galeria.map((imagem, index) => (
                        <div key={`new-${index}`} className="relative">
                          <img
                            src={URL.createObjectURL(imagem) || "/placeholder.svg"}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 text-white rounded-lg px-2 py-1">
                            <span className="text-xs truncate max-w-[calc(100%-20px)]">{imagem.name}</span>
                            <button
                              type="button"
                              onClick={() => removeGaleriaFile(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                  <label className="block text-white font-semibold mb-3">
                    <Package className="inline mr-2" size={20} />
                    Cores Disponíveis (Opcional)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={novaCor}
                      onChange={(e) => setNovaCor(e.target.value)}
                      placeholder="Nome da cor (ex: Branco, Preto, Bronze)..."
                      className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-[var(--secondary-blue)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={adicionarCor}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {cores.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cores.map((cor, index) => (
                        <div key={index} className="flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1">
                          <span className="text-white text-sm">{cor}</span>
                          <button
                            type="button"
                            onClick={() => removerCor(index)}
                            className="text-red-400 hover:text-red-300 ml-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue-dark)] text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? editingItem
                        ? "Atualizando..."
                        : "Adicionando..."
                      : editingItem
                        ? "Atualizar Item"
                        : "Adicionar ao Portfólio"}
                  </button>

                  {editingItem && (
                    <button
                      type="button"
                      onClick={clearForm}
                      className="px-6 py-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Itens do Portfólio</h2>

              {loadingItems ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/80">Carregando itens...</p>
                </div>
              ) : items.length === 0 ? (
                <p className="text-white/80 text-center py-8">Nenhum item encontrado.</p>
              ) : (
                <>
                  <DndContext sensors={sensors} onDragEnd={handleDragEndSections} collisionDetection={closestCenter}>
                    <SortableContext items={secoes.map((s) => s.nome)} strategy={horizontalListSortingStrategy}>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {secoes.map((secao) => (
                          <SortableSectionButton
                            key={secao.nome}
                            secao={secao}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    <DndContext sensors={sensors} onDragEnd={handleDragEndItems} collisionDetection={closestCenter}>
                      <SortableContext
                        items={filteredItems.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {filteredItems.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onEdit={editItem}
                            onDelete={deleteItem}
                            onTogglePin={togglePin}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-effect rounded-2xl p-8 border border-white/20 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Adicionar Nova Categoria</h3>
            <p className="text-white/80 text-sm mb-4">
              A nova categoria aparecerá automaticamente no portfólio público.
            </p>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da categoria..."
              className="w-full p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:border-[var(--secondary-blue)] focus:outline-none mb-6"
            />

            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">Ícone da Categoria (PNG, 64x64px)</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".png"
                  onChange={handleIconUpload}
                  className="hidden"
                  id="category-icon-upload"
                />
                <label
                  htmlFor="category-icon-upload"
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white cursor-pointer hover:bg-white/20 transition-colors text-sm"
                >
                  Escolher Ícone
                </label>
                {iconPreview && (
                  <div className="flex items-center gap-2">
                    <img
                      src={iconPreview || "/placeholder.svg"}
                      alt="Preview do ícone"
                      className="w-8 h-8 rounded border border-white/20"
                    />
                    <button
                      onClick={() => {
                        setNewCategoryIcon(null)
                        setIconPreview(null)
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
              <p className="text-white/60 text-xs mt-1">Formato: PNG | Tamanho: 64x64 pixels | Máximo: 2MB</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={addCategory}
                className="flex-1 bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue-dark)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setNewCategoryName("")
                  setNewCategoryIcon(null)
                  setIconPreview(null)
                }}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-effect rounded-2xl p-8 border border-white/20 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500">
              <AlertCircle className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Confirmar Exclusão</h3>
            <p className="text-white/80 mb-6">
              Tem certeza que deseja remover este item do portfólio? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Sim, remover
              </button>
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-effect rounded-2xl p-8 border border-white/20 max-w-md w-full text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                modalType === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {modalType === "success" ? (
                <CheckCircle className="text-white" size={32} />
              ) : (
                <AlertCircle className="text-white" size={32} />
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{modalType === "success" ? "Sucesso!" : "Erro!"}</h3>
            <p className="text-white/80 mb-6">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue-dark)] text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
