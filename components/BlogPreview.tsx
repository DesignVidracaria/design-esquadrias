"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, User, ArrowRight, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface BlogPost {
  id: string
  titulo: string
  conteudo: string
  autor_nickname: string
  imagens?: string[]
  created_at: string
}

export default function BlogPreview() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("ativo", true)
          .order("fixado", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(3)

        if (error) {
          console.error("Erro ao buscar posts:", error)
        } else {
          setPosts(data || [])
        }
      } catch (error) {
        console.error("Erro geral ao buscar posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  useEffect(() => {
    if (posts.length > 0 && !isDragging) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % posts.length)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [posts, isDragging])

  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
    setCurrentX(clientX)
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return

    setCurrentX(clientX)
    const diff = clientX - startX
    setDragOffset(diff)
  }

  const handleDragEnd = () => {
    if (!isDragging) return

    const diff = currentX - startX
    const threshold = 50 // Minimum drag distance to trigger slide change

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1)
      } else if (diff < 0 && currentSlide < posts.length - 1) {
        setCurrentSlide(currentSlide + 1)
      }
    }

    setIsDragging(false)
    setDragOffset(0)
    setStartX(0)
    setCurrentX(0)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (loading) {
    return (
      <section className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 shadow-xl shimmer-effect relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--secondary-blue)] to-[var(--primary-blue-medium)]" />

        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-2 sm:mb-4 text-shadow tracking-wide uppercase">
            NOSSO BLOG
          </h2>
          <div className="animate-pulse">
            <div className="h-4 bg-white/20 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </section>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <>
      <section className="p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 relative overflow-hidden lg:mb-0 lg:py-0 mt-24">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2 text-shadow tracking-wide uppercase lg:text-5xl sm:mb-4">
            DAILY BLOG
          </h2>
          {/* --- INÍCIO DA ALTERAÇÃO --- */}
          {/* O parágrafo do subtítulo foi substituído pela barra azul */}
          <div className="w-12 sm:w-16 lg:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-[var(--secondary-blue)] to-transparent mx-auto mt-4 sm:mt-5 rounded-full lg:mt-3" />
          {/* --- FIM DA ALTERAÇÃO --- */}
        </div>

        <div
          className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none"
          ref={carouselRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={isDragging ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * 100}%) translateX(${isDragging ? dragOffset : 0}px)`,
              transition: isDragging ? "none" : "transform 0.5s ease-in-out",
            }}
          >
            {posts.map((post) => (
              <div key={post.id} className="w-full flex-shrink-0">
                <div
                  className="relative backdrop-blur-sm rounded-xl p-4 sm:p-6 flex flex-col transition-all duration-300 border-solid border-white border-0 bg-slate-950 opacity-100 justify-center items-center sm:px-6 mx-0 gap-4 md:flex-row"
                  style={{
                    backgroundColor: "#396496",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#4c93e3"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#396496"
                  }}
                >
                  {post.imagens && post.imagens.length > 0 && (
                    <div className="relative w-full h-48 md:h-100 rounded-lg overflow-hidden shadow-lg md:w-6/12">
                      <Image
                        src={post.imagens[0] || "https://placehold.co/1000x400/2a2e45/fff?text=No+Image"}
                        alt={post.titulo}
                        fill
                        className="object-cover"
                      />
                    </div>
                   )}

                  <div className="space-y-3 w-full md:w-1/2 text-white">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold line-clamp-2 text-center">{post.titulo}</h3>

                    <p className="text-sm sm:text-base text-white/80 leading-relaxed line-clamp-4 overflow-hidden text-ellipsis">
                      {truncateText(post.conteudo, 250)}
                    </p>

                    <div className="flex items-center justify-between text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{post.autor_nickname}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/blog?id=${post.id}`}
                      className="inline-flex items-center gap-2 font-bold py-2 transition-all duration-300 hover:text-blue-200 cursor-pointer bg-white shadow text-slate-600 rounded-3xl text-base px-6 sm:py-1.5 border-4"
                      onClick={(e) => e.stopPropagation()} // Prevent drag interference
                    >
                      Leia mais
                      <ArrowRight size={16} className="sm:size-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-6 gap-2">
          {posts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ease-in-out ${
                currentSlide === index ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Ir para o slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="text-center mt-6 sm:mt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/20 backdrop-blur-md py-2.5 text-xl rounded-full bg-[rgba(55,98,149,1)]"
          >
            <FileText size={16} className="sm:size-5" />
            Ver Todos os Posts
            <ArrowRight size={16} className="sm:size-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
