"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, Eye, ExternalLink, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { supabase } from "@/lib/supabase"

// ===================================================================================
// CÓDIGO DO MODAL (SEM ALTERAÇÕES)
// ===================================================================================
interface ModalDisplayItem {
  titulo: string
  descricao: string
  imagem_principal: string
  galeria?: string[]
}
interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  item: ModalDisplayItem | null
}
function ProductModal({ isOpen, onClose, item }: ProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  useEffect(() => {
    setSelectedImageIndex(0)
  }, [item])
  if (!isOpen || !item) {
    return null
  }
  const allImages = [item.imagem_principal, ...(item.galeria || [])].filter(Boolean)
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % allImages.length)
  }
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length)
  }
  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-effect rounded-2xl p-6 max-w-4xl w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{item.titulo}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-3xl font-bold leading-none">
            ×
          </button>
        </div>
        <div className="mb-6">
          <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden">
            {allImages.length > 1 && (
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors duration-200 z-20"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <Image
              src={allImages[selectedImageIndex] || "/placeholder.svg"}
              alt={`${item.titulo} ${selectedImageIndex + 1}`}
              fill
              className="object-contain"
            />
            {allImages.length > 1 && (
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors duration-200 z-20"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
        <div className="mb-6">
          <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
        </div>
        {allImages.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {allImages.map((image, index) => (
              <div
                key={index}
                className={`h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                  selectedImageIndex === index
                    ? "border-[var(--secondary-blue)]"
                    : "border-transparent hover:border-[var(--secondary-blue)]/50"
                }`}
                onClick={() => setSelectedImageIndex(index)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${item.titulo} thumbnail ${index + 1}`}
                  width={120}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
// ===================================================================================
// FIM DO CÓDIGO DO MODAL
// ===================================================================================

interface BlogPost {
  id: string
  titulo: string
  conteudo: string
  autor_nickname: string
  imagens?: string[]
  videos?: string[]
  links?: (string | { titulo: string; url: string })[]
  fixado: boolean
  ativo: boolean
  created_at: string
}

function BlogContent({ onImageSelect }: { onImageSelect: (imageUrl: string, post: BlogPost) => void }) {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const searchParams = useSearchParams()
  const postIdFromUrl = searchParams.get("id")

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("ativo", true)
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar posts:", error)
      } else {
        const fetchedPosts = data || []
        setPosts(fetchedPosts)

        if (postIdFromUrl && fetchedPosts.some((p) => p.id === postIdFromUrl)) {
          setExpandedPosts(new Set([postIdFromUrl]))
        } else if (fetchedPosts.length > 0) {
          setExpandedPosts(new Set([fetchedPosts[0].id]))
        }
      }
    } catch (error) {
      console.error("Erro geral ao buscar posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePost = (postId: string) => {
    setExpandedPosts((prev) => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(postId)) {
        newExpanded.delete(postId)
      } else {
        newExpanded.add(postId)
      }
      return newExpanded
    })
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

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes("youtu.be/"         )) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes("vimeo.com/"         )) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return url
  }

  const processLinks = (links: any         ) => {
    if (!links) return []
    if (typeof links === "string") {
      try {
        const parsedLinks = JSON.parse(links)
        if (Array.isArray(parsedLinks)) {
          return parsedLinks.map((linkItem) => {
            if (typeof linkItem === "object" && linkItem !== null && "url" in linkItem) {
              return { title: linkItem.titulo || linkItem.url, url: linkItem.url }
            }
            return { title: linkItem, url: linkItem }
          })
        }
      } catch (e) {
        console.error("Erro ao fazer parse dos links:", e)
        return []
      }
    }
    if (Array.isArray(links)) {
      return links.map((linkItem) => {
        if (typeof linkItem === "object" && linkItem !== null && "url" in linkItem) {
          return { title: linkItem.titulo || linkItem.url, url: linkItem.url }
        }
        return { title: linkItem, url: linkItem }
      })
    }
    return []
  }

  return (
    <div className="container mx-auto px-4 py-4 max-sm:py-2">
      <header className="text-center mb-6 max-sm:mb-3 animate-fadeIn pt-12 sm:pt-0">
        <div className="mb-2 max-sm:mb-1 sm:mb-0 py-0">
          <Link href="/" className="inline-block">
            <div className="w-48 h-36 max-sm:w-56 max-sm:h-42 max-sm:-mt-8 sm:w-48 sm:h-36 md:w-56 md:h-42 lg:w-64 relative cursor-pointer hover:scale-105 transition-transform duration-300 mx-0 my-2.5 lg:h-48">
              <Image
                src="/LOGO.png"
                alt="Design Vidraçaria Logo"
                width={1500}
                height={1200}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </Link>
        </div>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed mt-2">
          Fique por dentro das novidades, projetos e dicas da Design Vidraçaria
        </p>
      </header>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Carregando posts...</p>
        </div>
      )}

      <div className="animate-fadeIn">
        {!loading && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/80 text-lg">Nenhum post encontrado.</p>
              </div>
            ) : (
              <div className="space-y-4 max-sm:space-y-2">
                {posts.map((post) => {
                  const processedLinks = processLinks(post.links)
                  const isExpanded = expandedPosts.has(post.id)

                  return (
                    <article
                      key={post.id}
                      className={`glass-effect rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 max-w-4xl mx-auto ${
                        post.fixado ? "ring-2 ring-[var(--secondary-blue)]/50" : ""
                      }`}
                    >
                      <div
                        className="p-4 sm:p-6 border-b border-white/10 bg-darkblue-800/20 hover:bg-white-800/20 transition-colors duration-300 flex items-center justify-between sm:py-6"
                        onClick={() => togglePost(post.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                              <User size={16} />
                              <span>{post.autor_nickname}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                              <Calendar size={16} />
                              <span>{formatDate(post.created_at)}</span>
                            </div>
                          </div>
                          <h2 className="text-xl md:text-2xl font-bold text-white">{post.titulo}</h2>
                        </div>
                        <ChevronDown
                          size={24}
                          className={`text-white transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePost(post.id)
                          }}
                        />
                      </div>
                      {isExpanded && (
                        <div className="p-4 sm:p-6 animate-fadeIn">
                          <div className="text-white/90 leading-relaxed mb-6 whitespace-pre-wrap">{post.conteudo}</div>

                          {post.imagens && post.imagens.length > 0 && (
                            <div className="mb-6">
                              <div className="flex flex-col items-center space-y-4">
                                {post.imagens.map((imagem, index) => (
                                  <div key={index} className="w-full max-w-xl">
                                    <div
                                      className="relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer group"
                                      onClick={() => onImageSelect(imagem, post)}
                                    >
                                      <Image
                                        src={imagem || "/placeholder.svg"}
                                        alt={`Imagem ${index + 1} do post`}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                            <Eye className="text-white" size={20} />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {post.videos && post.videos.length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold text-white mb-4">Vídeos</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {post.videos.map((video, index) => (
                                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                                    {video.includes("youtube.com") ||
                                    video.includes("youtu.be") ||
                                    video.includes("vimeo.com") ? (
                                      <iframe
                                        src={getEmbedUrl(video)}
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={`Vídeo ${index + 1}`}
                                      />
                                    ) : (
                                      <video controls className="w-full h-full object-contain" preload="metadata">
                                        <source src={video} />
                                        Seu navegador não suporta o elemento de vídeo.
                                      </video>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {processedLinks.length > 0 && (
                            <div className="mb-6">
                              <div className="flex flex-col items-center space-y-3">
                                {processedLinks.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-full max-w-sm gap-3 p-4 bg-green-500 rounded-full border border-green-500/50 hover:bg-green-600 transition-all duration-300 group"
                                  >
                                    <ExternalLink
                                      className="text-white group-hover:scale-110 transition-transform duration-300"
                                      size={20}
                                    />
                                    <span className="text-white flex-1 truncate text-center">{link.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function BlogPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ModalDisplayItem | null>(null)

  const handleImageClick = (imageUrl: string, post: BlogPost) => {
    setSelectedItem({
      titulo: post.titulo,
      descricao: `Imagem do post "${post.titulo}".`,
      imagem_principal: imageUrl,
      galeria: post.imagens,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  return (
    // --- INÍCIO DA CORREÇÃO ---
    // A estrutura foi alterada para espelhar a da página Home.
    <div className="flex min-h-screen relative">
      <Sidebar currentPage="blog" onToggle={setSidebarOpen} hideToggleButton={showModal} />

      <div
        className={`flex-1 relative z-10 w-full transition-all duration-300 ${sidebarOpen ? "ml-44 lg:ml-48" : "ml-0"}`}
      >
        {!showModal && <Header currentPage="blog" onHeaderToggle={setHeaderVisible} />}
        
        <main>
          <Suspense
            fallback={
              <div className="container mx-auto px-4 py-8 text-center text-white/80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                Carregando conteúdo...
              </div>
            }
          >
            <BlogContent onImageSelect={handleImageClick} />
          </Suspense>
        </main>

        <ProductModal isOpen={showModal} onClose={closeModal} item={selectedItem} />

        <div className="flex-grow"></div>
        <div className="relative z-40 mt-auto">
          <Footer currentPage="blog" showLogin={true} />
        </div>
      </div>
    </div>
    // --- FIM DA CORREÇÃO ---
  )
}
