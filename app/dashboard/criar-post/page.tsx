"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PenTool, ImageIcon, Video, Pin, Trash2, Edit, User, X, Plus, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface BlogPost {
  id: string
  titulo: string
  conteudo: string
  user_id: string
  autor_nickname: string
  imagens?: string[]
  videos?: string[]
  links?: Array<{ titulo: string; url: string }>
  fixado: boolean
  created_at: string
}

export default function CriarPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalType, setModalType] = useState<"success" | "error">("success")
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Estados do formulário
  const [titulo, setTitulo] = useState("")
  const [conteudo, setConteudo] = useState("")

  // Estados para novas mídias a serem carregadas
  const [imagens, setImagens] = useState<File[]>([])
  const [videos, setVideos] = useState<File[]>([])

  // Novos estados para mídias existentes no post
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [existingVideos, setExistingVideos] = useState<string[]>([])

  const [links, setLinks] = useState<Array<{ titulo: string; url: string }>>([])
  const [novoLinkTitulo, setNovoLinkTitulo] = useState("")
  const [novoLinkUrl, setNovoLinkUrl] = useState("")

  // Novo estado para o modo de edição
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    checkTableStructure()
    fetchPosts()
  }, [])

  const checkTableStructure = async () => {
    try {
      const { error } = await supabase.from("blog_posts").select("count", { count: "exact", head: true })

      if (error) {
        console.error("Erro ao verificar estrutura da tabela:", error)
        setTableExists(false)
        showMessage("Tabela blog_posts não encontrada. Execute o script SQL para criar a estrutura.", "error")
      } else {
        setTableExists(true)
      }
    } catch (error) {
      console.error("Erro geral ao verificar tabela:", error)
      setTableExists(false)
    }
  }

  const fetchPosts = async () => {
    if (!tableExists) {
      setLoadingPosts(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("ativo", true)
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar posts:", error)
        showMessage("Erro ao carregar posts do blog", "error")
      } else {
        const postsWithParsedLinks = data.map((post: BlogPost) => ({
          ...post,
          links: post.links ? (typeof post.links === "string" ? JSON.parse(post.links) : post.links) : [],
        }))
        setPosts(postsWithParsedLinks || [])
      }
    } catch (error) {
      console.error("Erro geral ao buscar posts:", error)
      showMessage("Erro inesperado ao carregar posts", "error")
    } finally {
      setLoadingPosts(false)
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImagens((prev) => [...prev, ...newImages])
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newVideos = Array.from(e.target.files)
      setVideos((prev) => [...prev, ...newVideos])
    }
  }

  // Função para remover uma imagem recém-carregada
  const removeImage = (index: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== index))
  }
  // Função para remover um vídeo recém-carregado
  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
  }
  // Nova função para remover uma imagem já existente
  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }
  // Nova função para remover um vídeo já existente
  const removeExistingVideo = (index: number) => {
    setExistingVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const adicionarLink = () => {
    if (novoLinkTitulo.trim() && novoLinkUrl.trim()) {
      setLinks((prev) => [...prev, { titulo: novoLinkTitulo.trim(), url: novoLinkUrl.trim() }])
      setNovoLinkTitulo("")
      setNovoLinkUrl("")
    }
  }

  const removerLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  const clearForm = () => {
    setTitulo("")
    setConteudo("")
    setImagens([])
    setVideos([])
    setExistingImages([]) // Limpa as imagens existentes
    setExistingVideos([]) // Limpa os vídeos existentes
    setLinks([])
    setNovoLinkTitulo("")
    setNovoLinkUrl("")
    setEditingPost(null)
  }

  const toggleFixarPost = async (postId: string, fixado: boolean) => {
    try {
      const { error } = await supabase.from("blog_posts").update({ fixado: !fixado }).eq("id", postId)

      if (error) {
        console.error("Erro ao alterar status do post:", error)
        showMessage("Erro ao alterar status do post", "error")
        return
      }

      fetchPosts()
      showMessage(`Post ${!fixado ? "fixado" : "desfixado"} com sucesso!`, "success")
    } catch (error) {
      console.error("Erro geral ao alterar post:", error)
      showMessage("Erro inesperado ao alterar post", "error")
    }
  }

  const deletePost = async (postId: string) => {
    showMessage("Tem certeza que deseja apagar este post?", "error", async () => {
      try {
        const { error } = await supabase.from("blog_posts").update({ ativo: false }).eq("id", postId)

        if (error) {
          console.error("Erro ao apagar post:", error)
          showMessage("Erro ao apagar post", "error")
          return
        }

        fetchPosts()
        showMessage("Post apagado com sucesso!", "success")
      } catch (error) {
        console.error("Erro geral ao apagar post:", error)
        showMessage("Erro inesperado ao apagar post", "error")
      }
    })
  }

  // Lógica para iniciar a edição de um post
  const startEditing = (post: BlogPost) => {
    setEditingPost(post)
    setTitulo(post.titulo)
    setConteudo(post.conteudo)
    setLinks(post.links || [])
    // Popula os estados com as mídias existentes
    setExistingImages(post.imagens || [])
    setExistingVideos(post.videos || [])
    // Limpa os estados de novas mídias para começar do zero
    setImagens([])
    setVideos([])
  }

  // Lógica para atualizar um post
  const updatePost = async (postId: string) => {
    if (!titulo.trim() || !conteudo.trim()) {
      showMessage("Título e conteúdo são obrigatórios", "error")
      return
    }

    setLoading(true)

    try {
      // Upload das novas imagens
      const newImagensUrls: string[] = []
      for (const imagem of imagens) {
        const url = await uploadFile(imagem)
        if (url) newImagensUrls.push(url)
      }

      // Combina as imagens existentes com as novas
      const finalImagensUrls = [...existingImages, ...newImagensUrls]

      // Upload dos novos vídeos
      const newVideosUrls: string[] = []
      for (const video of videos) {
        const url = await uploadFile(video)
        if (url) newVideosUrls.push(url)
      }

      // Combina os vídeos existentes com os novos
      const finalVideosUrls = [...existingVideos, ...newVideosUrls]

      // Preparar dados do post a serem atualizados
      const postData: any = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        user_id: editingPost?.user_id || "", // Ensure user_id is set correctly
        autor_nickname: editingPost?.autor_nickname || "",
        imagens: finalImagensUrls.length > 0 ? finalImagensUrls : null,
        videos: finalVideosUrls.length > 0 ? finalVideosUrls : null,
        links: links.length > 0 ? JSON.stringify(links) : null,
      }

      const { error } = await supabase.from("blog_posts").update(postData).eq("id", postId)

      if (error) {
        console.error("Erro ao atualizar post:", error)
        showMessage(`Erro ao atualizar post: ${error.message}`, "error")
        return
      }

      showMessage("Post atualizado com sucesso!", "success")
      clearForm()
      fetchPosts()
    } catch (error) {
      console.error("Erro geral na atualização:", error)
      showMessage("Erro inesperado ao atualizar post", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tableExists) {
      showMessage("Execute o script SQL antes de criar posts", "error")
      return
    }

    if (editingPost) {
      updatePost(editingPost.id)
    } else {
      if (!titulo.trim() || !conteudo.trim()) {
        showMessage("Título e conteúdo são obrigatórios", "error")
        return
      }
      setLoading(true)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          showMessage("Usuário não autenticado", "error")
          return
        }

        const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user.id).single()

        const imagensUrls: string[] = []
        for (const imagem of imagens) {
          const url = await uploadFile(imagem)
          if (url) imagensUrls.push(url)
        }

        const videosUrls: string[] = []
        for (const video of videos) {
          const url = await uploadFile(video)
          if (url) videosUrls.push(url)
        }

        const postData: any = {
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          user_id: user.id,
          autor_nickname: profile?.nome || user.email || "Usuário",
        }

        if (imagensUrls.length > 0) {
          postData.imagens = imagensUrls
        }
        if (videosUrls.length > 0) {
          postData.videos = videosUrls
        }
        if (links.length > 0) {
          postData.links = JSON.stringify(links)
        }

        console.log("Dados do post a serem inseridos:", postData)

        const { error } = await supabase.from("blog_posts").insert([postData])

        if (error) {
          console.error("Erro ao criar post:", error)
          showMessage(`Erro ao criar post: ${error.message}`, "error")
          return
        }

        showMessage("Post criado com sucesso!", "success")
        clearForm()
        fetchPosts()
      } catch (error) {
        console.error("Erro geral:", error)
        showMessage("Erro inesperado ao criar post", "error")
      } finally {
        setLoading(false)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Função para lidar com o evento de arrastar e soltar
  const onDragEnd = async (result: any) => {
    // Se o item for solto fora da área de soltar, não faz nada
    if (!result.destination) {
      return
    }

    // Cria uma nova lista de posts com a nova ordem
    const newPosts = Array.from(posts)
    const [reorderedItem] = newPosts.splice(result.source.index, 1)
    newPosts.splice(result.destination.index, 0, reorderedItem)

    // Atualiza o estado local para uma experiência de usuário instantânea
    setPosts(newPosts)
  }

  return (
    <div className="p-6 flex justify-center">
      <div className="max-w-6xl w-full">
        <div className="glass-effect rounded-2xl p-6 mb-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">Criar Post do Blog</h1>
          <p className="text-white/80">Crie e gerencie posts para o blog da Design Vidraçaria</p>
        </div>
        {!tableExists && (
          <div className="glass-effect rounded-2xl p-6 mb-8 border border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-400" size={24} />
              <h3 className="text-xl font-bold text-white">Estrutura do Blog Não Encontrada</h3>
            </div>
            <p className="text-white/90 mb-4">A tabela do blog não foi encontrada ou está com estrutura incompleta.</p>
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-white/80 font-semibold mb-2">Para resolver:</p>
              <ol className="text-white/70 space-y-1 text-sm">
                <li>
                  1. Execute o script SQL:{" "}
                  <code className="bg-black/30 px-1 py-0.5 rounded">CREATE TABLE blog_posts (...)</code>
                </li>
                <li>
                  2. Execute o script SQL para a coluna de ordem:{" "}
                  <code className="bg-black/30 px-1 py-0.5 rounded">
                    ALTER TABLE blog_posts ADD COLUMN order_index INT;
                  </code>
                </li>
                <li>3. Recarregue a página.</li>
              </ol>
            </div>
          </div>
        )}
        {/* CONTAINER DOS COMPONENTES PRINCIPAIS: FORMULÁRIO E LISTA DE POSTS */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulário para criação/edição de post */}
          {editingPost ? (
            <form className="lg:w-1/2 glass-effect rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Editar Post</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="titulo" className="block text-white/80 font-semibold mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] transition-colors placeholder-slate-400"
                    placeholder="Título do seu post"
                  />
                </div>
                <div>
                  <label htmlFor="conteudo" className="block text-white/80 font-semibold mb-1">
                    Conteúdo
                  </label>
                  <textarea
                    id="conteudo"
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] transition-colors placeholder-slate-400"
                    placeholder="Escreva o conteúdo do seu post aqui..."
                  />
                </div>
                {/* Mídias existentes */}
                {(existingImages.length > 0 || existingVideos.length > 0) && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/80 font-semibold mb-3">Mídias Existentes</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {existingImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Imagem ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {existingVideos.map((url, index) => (
                        <div key={index} className="relative group">
                          <video
                            src={url}
                            controls
                            className="w-full h-24 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingVideo(index)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Upload de mídias para edição */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="imagens" className="block text-white/80 font-semibold mb-1">
                      Adicionar Imagens
                    </label>
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor="image-upload"
                        className="w-full flex items-center justify-center p-3 text-white/90 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors"
                      >
                        <ImageIcon size={20} className="mr-2" />
                        <span>Selecione Imagens</span>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    {imagens.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {imagens.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file) || "/placeholder.svg"}
                              alt={file.name}
                              className="w-full h-24 object-cover rounded-lg border border-white/20"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="videos" className="block text-white/80 font-semibold mb-1">
                      Adicionar Vídeos
                    </label>
                    <div className="flex items-center space-x-2">
                      <label
                        htmlFor="video-upload"
                        className="w-full flex items-center justify-center p-3 text-white/90 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors"
                      >
                        <Video size={20} className="mr-2" />
                        <span>Selecione Vídeos</span>
                      </label>
                      <input
                        id="video-upload"
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </div>
                    {videos.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {videos.map((file, index) => (
                          <div key={index} className="relative group">
                            <video
                              src={URL.createObjectURL(file)}
                              controls
                              className="w-full h-24 object-cover rounded-lg border border-white/20"
                            />
                            <button
                              type="button"
                              onClick={() => removeVideo(index)}
                              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Links */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/80 font-semibold mb-3">Links</p>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={novoLinkTitulo}
                      onChange={(e) => setNovoLinkTitulo(e.target.value)}
                      className="w-1/3 bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] placeholder-slate-400"
                      placeholder="Título"
                    />
                    <input
                      type="text"
                      value={novoLinkUrl}
                      onChange={(e) => setNovoLinkUrl(e.target.value)}
                      className="w-2/3 bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] placeholder-slate-400"
                      placeholder="URL (ex: https://exemplo.com)"
                    />
                    <button
                      type="button"
                      onClick={adicionarLink}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                      title="Adicionar Link"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {links.length > 0 && (
                    <ul className="space-y-2 mt-4">
                      {links.map((link, index) => (
                        <li key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--secondary-blue)] hover:underline flex-grow mr-4 truncate"
                          >
                            {link.titulo}
                          </a>
                          <button
                            type="button"
                            onClick={() => removerLink(index)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="animate-spin h-5 w-5 border-4 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      <>
                        <Edit size={20} className="mr-2" />
                        Atualizar Post
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="bg-gray-500/20 hover:bg-gray-500/30 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="lg:w-1/2 glass-effect rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Criar Novo Post</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="titulo" className="block text-white/80 font-semibold mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] transition-colors placeholder-slate-400"
                    placeholder="Título do seu post"
                  />
                </div>
                <div>
                  <label htmlFor="conteudo" className="block text-white/80 font-semibold mb-1">
                    Conteúdo
                  </label>
                  <textarea
                    id="conteudo"
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] transition-colors placeholder-slate-400"
                    placeholder="Escreva o conteúdo do seu post aqui..."
                  />
                </div>
                {/* Upload de Imagens */}
                <div>
                  <label htmlFor="imagens" className="block text-white/80 font-semibold mb-1">
                    Imagens
                  </label>
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="image-upload"
                      className="w-full flex items-center justify-center p-3 text-white/90 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors"
                    >
                      <ImageIcon size={20} className="mr-2" />
                      <span>Selecione Imagens</span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  {imagens.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {imagens.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file) || "/placeholder.svg"}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Upload de Vídeos */}
                <div>
                  <label htmlFor="videos" className="block text-white/80 font-semibold mb-1">
                    Vídeos
                  </label>
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="video-upload"
                      className="w-full flex items-center justify-center p-3 text-white/90 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors"
                    >
                      <Video size={20} className="mr-2" />
                      <span>Selecione Vídeos</span>
                    </label>
                    <input
                      id="video-upload"
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </div>
                  {videos.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {videos.map((file, index) => (
                        <div key={index} className="relative group">
                          <video
                            src={URL.createObjectURL(file)}
                            controls
                            className="w-full h-24 object-cover rounded-lg border border-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Links */}
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-white/80 font-semibold mb-3">Links</p>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={novoLinkTitulo}
                      onChange={(e) => setNovoLinkTitulo(e.target.value)}
                      className="w-1/3 bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] placeholder-slate-400"
                      placeholder="Título"
                    />
                    <input
                      type="text"
                      value={novoLinkUrl}
                      onChange={(e) => setNovoLinkUrl(e.target.value)}
                      className="w-2/3 bg-slate-200 text-slate-900 border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary-blue)] placeholder-slate-400"
                      placeholder="URL (ex: https://exemplo.com)"
                    />
                    <button
                      type="button"
                      onClick={adicionarLink}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                      title="Adicionar Link"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {links.length > 0 && (
                    <ul className="space-y-2 mt-4">
                      {links.map((link, index) => (
                        <li key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--secondary-blue)] hover:underline flex-grow mr-4 truncate"
                          >
                            {link.titulo}
                          </a>
                          <button
                            type="button"
                            onClick={() => removerLink(index)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-[var(--primary-blue)] hover:bg-[var(--secondary-blue)] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="animate-spin h-5 w-5 border-4 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <PenTool size={20} className="mr-2" />
                      Publicar Post
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* LISTA DE POSTS EXISTENTES */}
          <div className="lg:w-1/2 glass-effect rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Todos os Posts</h2>
            {loadingPosts ? (
              <div className="flex justify-center items-center h-48">
                <span className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full"></span>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="posts-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {posts.map((post, index) => (
                        <Draggable key={post.id} draggableId={post.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`glass-effect-card rounded-xl p-4 border border-white/20 relative ${post.fixado ? "border-yellow-400/50 bg-yellow-400/10" : ""}`}
                            >
                              {post.fixado && (
                                <div className="absolute top-0 right-0 p-2 text-yellow-400" title="Post fixado">
                                  <Pin size={16} fill="currentColor" />
                                </div>
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white/90">{post.titulo}</h3>
                                <span className="text-sm text-white/60">{formatDate(post.created_at)}</span>
                              </div>
                              <p className="text-sm text-white/80 line-clamp-3 mb-2">{post.conteudo}</p>
                              <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
                                <User size={16} />
                                <span>{post.autor_nickname}</span>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => toggleFixarPost(post.id, post.fixado)}
                                  className="p-2 rounded-full transition-colors"
                                  title={post.fixado ? "Desafixar Post" : "Fixar Post"}
                                >
                                  <Pin
                                    size={20}
                                    className={post.fixado ? "text-yellow-400" : "text-white/60 hover:text-white/80"}
                                  />
                                </button>
                                <button
                                  onClick={() => startEditing(post)}
                                  className="p-2 rounded-full text-white/60 hover:text-white/80 transition-colors"
                                  title="Editar Post"
                                >
                                  <Edit size={20} />
                                </button>
                                <button
                                  onClick={() => deletePost(post.id)}
                                  className="p-2 rounded-full text-red-500 hover:text-red-600 transition-colors"
                                  title="Apagar Post"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação/mensagem */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-white/20 max-w-sm w-full text-center">
            <div
              className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center
              ${modalType === "success" ? "bg-green-500" : "bg-red-500"} `}
            >
              {modalType === "success" ? (
                <CheckCircle className="text-white" size={32} />
              ) : (
                <AlertCircle className="text-white" size={32} />
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              {confirmCallback ? "Confirmação" : modalType === "success" ? "Sucesso!" : "Erro!"}
            </h3>
            <p className="text-white/80 mb-6">{modalMessage}</p>
            <div className="flex justify-center gap-4">
              {confirmCallback && (
                <button
                  onClick={handleCancel}
                  className="bg-gray-500/20 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-gray-500/30"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`text-white font-bold py-3 px-6 rounded-lg transition-colors ${
                  confirmCallback
                    ? "bg-red-500 hover:bg-red-600"
                    : modalType === "success"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {confirmCallback ? "Confirmar" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
