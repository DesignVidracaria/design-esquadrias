"use client"

import type React from "react"
// ImageModal não é mais importado
import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useCarousel } from "@/hooks/useCarousel"
import { createClient } from "@/lib/supabase"

interface HeroImage {
  id: string
  nome_arquivo: string
  url_imagem: string
  alt_text?: string
  ordem: number
  ativo: boolean
}

interface HeroButton {
  id: string
  titulo: string
  link: string
  ativo: boolean
}

// A prop onModalToggle foi removida
export default function HeroSection() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([])
  const [heroButton, setHeroButton] = useState<HeroButton | null>(null)
  const [fallbackButton, setFallbackButton] = useState<HeroButton | null>(null)
  const [loading, setLoading] = useState(true)

  const { currentIndex, goToSlide, nextSlide, prevSlide } = useCarousel({
    totalSlides: heroImages.length,
    autoPlay: true,
    autoPlayInterval: 5000,
  })

  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchHeroImages()
    fetchHeroButton()
  }, [])

  const fetchHeroImages = async () => {
    try {
      const { data, error } = await supabase.from("hero_images").select("*").eq("ativo", true).order("ordem")

      if (error) throw error
      setHeroImages(data || [])
    } catch (error) {
      console.error("Erro ao buscar imagens do hero:", error)
      setHeroImages([
        {
          id: "1",
          nome_arquivo: "IMG1.png",
          url_imagem: "/IMG1.png",
          alt_text: "Design Vidraçaria - Banheiro Luxuoso",
          ordem: 0,
          ativo: true,
        },
        {
          id: "2",
          nome_arquivo: "IMG2.png",
          url_imagem: "/IMG2.png",
          alt_text: "Design Vidraçaria - Casa Moderna",
          ordem: 1,
          ativo: true,
        },
        {
          id: "3",
          nome_arquivo: "IMG3.png",
          url_imagem: "/IMG3.png",
          alt_text: "Design Vidraçaria - Esquadrias Internas",
          ordem: 2,
          ativo: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchHeroButton = async () => {
    try {
      const { data, error } = await supabase.from("hero_button").select("*").eq("ativo", true).single()

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar botão do hero:", error)
        setHeroButton(null)
      } else if (error && error.code === "PGRST116") {
        console.log("Nenhum botão ativo encontrado na tabela 'hero_button'.")
        setHeroButton(null)
      } else {
        setHeroButton(data)
      }

      if (!data || (error && error.code !== "PGRST116")) {
        setFallbackButton({
          id: "fallback-1",
          titulo: "CONFIRA NOSSO PORTFÓLIO",
          link: "#portfolio",
          ativo: true,
        })
      }
    } catch (error) {
      console.error("Erro fatal ao buscar botão do hero:", error)
      setHeroButton(null)
      setFallbackButton({
        id: "fallback-2",
        titulo: "CONFIRA NOSSO PORTFÓLIO",
        link: "#portfolio",
        ativo: true,
      })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return

    const endX = e.changedTouches[0].clientX
    const diffX = startX - endX

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }

    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return

    const endX = e.clientX
    const diffX = startX - endX

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }

    setIsDragging(false)
  }

  if (loading) {
    return (
      <section className="text-center mb-4 sm:mb-6 lg:mb-8">
        <div className="w-full max-w-7xl aspect-[2.4/1] mx-auto mb-3 sm:mb-4 lg:mb-6 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl relative bg-gray-300 animate-pulse"></div>
      </section>
    )
  }

  if (heroImages.length === 0) {
    return (
      <section className="text-center mb-4 sm:mb-6 lg:mb-8">
        <div className="w-full max-w-7xl aspect-[2.4/1] mx-auto mb-3 sm:mb-4 lg:mb-6 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl relative bg-gray-300 flex items-center justify-center">
          <p className="text-gray-600">Nenhuma imagem encontrada</p>
        </div>
      </section>
    )
  }

  const buttonToRender = heroButton || fallbackButton

  return (
    <section className="text-center mb-4 sm:mb-6 lg:scale-[0.65] lg:origin-top lg:mb-0">
      <div
        ref={carouselRef}
        className="w-full max-w-7xl aspect-[2.4/1] mx-auto mb-3 sm:mb-4 lg:mb-6 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl relative cursor-pointer select-none hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {heroImages.map((image, index) => (
            <div
              key={image.id}
              className="min-w-full h-full relative shimmer-effect overflow-hidden"
            >
              <Image
                src={image.url_imagem || "/placeholder.svg"}
                alt={image.alt_text || image.nome_arquivo}
                fill
                className="object-cover transition-transform duration-500"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 sm:gap-2 lg:gap-3 mb-4 sm:mb-6 lg:mb-6">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-[var(--secondary-blue)] scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
      <p className="max-w-6xl mx-auto text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed text-white/95 mb-4 sm:mb-5 px-2 sm:px-4 lg:scale-[1.54] lg:origin-center lg:mb-0 mt-7 lg:mt-4">
        Especialistas em Esquadrias de Alumínio e Vidros Especiais!
      </p>
      {/* --- INÍCIO DA ALTERAÇÃO 1: ESPAÇAMENTO --- */}
      <div className="mb-6 sm:mb-8 lg:scale-[1.54] lg:origin-center lg:mb-0 mt-6 lg:mt-12">
      {/* --- FIM DA ALTERAÇÃO 1 --- */}
        {buttonToRender && (
          <a
            href={buttonToRender.link}
            // --- INÍCIO DA ALTERAÇÃO 2: TAMANHO DO BOTÃO ---
            className="inline-flex items-center px-7 py-1.5 sm:px-8 sm:py-4 font-bold text-base transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-1 shadow-lg rounded-full bg-white/20 border text-slate-800 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent before:translate-x-[-100%] before:animate-[shine_3s_ease-in-out_infinite] hover:bg-white/40 lg:py-2 lg:px-16 border-white border-double"
            // --- FIM DA ALTERAÇÃO 2 ---
          >
            <span className="mr-2 text-xl relative z-10 text-white">{buttonToRender.titulo}</span>
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 transition-transform duration-300 group-hover:translate-x-1 text-slate-800 relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        )}
      </div>
      {/* NENHUM MODAL É RENDERIZADO AQUI */}
    </section>
  )
}
