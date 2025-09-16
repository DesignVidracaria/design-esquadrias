"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Instagram } from "lucide-react"

/**
 * Interface para definir a estrutura de um post do Instagram.
 * Estes dados são retornados pela sua API de backend.
 */
interface InstagramPost {
  id: string
  image: string
  url: string
  alt: string
}

/**
 * Componente para exibir um feed de posts do Instagram de forma customizada.
 * Ele agora busca os posts da sua rota de API (`/api/instagram_feed`).
 */
export default function InstagramSection() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)

  /**
   * Efeito para buscar os posts da sua API de backend.
   * Ele faz a chamada para o endpoint `/api/instagram_feed` e atualiza o estado
   * do componente com os dados retornados.
   */
  useEffect(() => {
    const fetchInstagramPosts = async () => {
      try {
        const response = await fetch("/api/instagram_feed")
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.statusText}`)
        }
        const data = await response.json()
        setPosts(data)
      } catch (error) {
        console.error("Erro ao buscar posts do Instagram:", error)
        // Em caso de erro, você pode definir um estado de erro ou
        // mostrar um fallback.
      } finally {
        setLoading(false)
      }
    }

    fetchInstagramPosts()
  }, [])

  return (
    <section className="px-4 relative py-0 mb-0">
      <div className="container mx-auto max-w-6xl py-0 my-0">
        {/* Título da seção */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-shadow-lg lg:text-4xl">{"INSTAGRAM"}</h2>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Acompanhe os novos projetos e novidades em nossas redes sociais
          </p>
        </div>

        {/* Indicador de carregamento */}
        {loading && (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white/80">Carregando posts...</p>
          </div>
        )}

        {/* Grid de posts do Instagram */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-0">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={post.url}
                target="_blank"
                className="block relative overflow-hidden rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 group cursor-pointer"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={post.image || "/placeholder.svg"}
                    alt={post.alt}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
