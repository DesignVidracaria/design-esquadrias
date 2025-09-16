"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import ServicesSection from "@/components/ServicesSection"
import BlogPreview from "@/components/BlogPreview"
import SocialMedia from "@/components/SocialMedia"
import Footer from "@/components/Footer"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showGradientFooter, setShowGradientFooter] = useState(true)

  const [backgroundImages, setBackgroundImages] = useState<string[]>([])
  const [currentBgIndex, setCurrentBgIndex] = useState(0)
  const [isFading, setIsFading] = useState(true)

  const FADE_DURATION = 3000 // 1.5 segundos para a transição de fade
  const HOLD_DURATION = 10000 // 10 segundos com a imagem visível

  useEffect(() => {
    const fetchBackgroundImages = async () => {
      try {
        const { data, error } = await supabase
          .from("background_images")
          .select("image_url")
          .order("created_at", { ascending: false })

        if (error) throw error
        
        const imageUrls = (data || []).map((row) => row.image_url)
        setBackgroundImages(imageUrls)
      } catch (e) {
        console.error("Erro ao buscar imagens de fundo:", e)
      }
    }

    fetchBackgroundImages()
  }, [])

  // --- LÓGICA DO CARROSSEL CORRIGIDA ---
  useEffect(() => {
    // Se não houver imagens para o carrossel, não faz nada.
    if (backgroundImages.length < 2) {
      if (backgroundImages.length === 1) {
        setIsFading(false);
      }
      return;
    }

    // 1. Inicia o FADE-IN da imagem atual.
    const fadeInTimer = setTimeout(() => {
      setIsFading(false);
    }, 50); // Pequeno delay para garantir que a transição comece.

    // 2. Agenda o FADE-OUT e a TROCA da imagem para o futuro.
    const cycleTimer = setTimeout(() => {
      // Inicia o fade-out.
      setIsFading(true);
      
      // Agenda a troca do índice para DEPOIS que o fade-out terminar.
      const nextImageTimer = setTimeout(() => {
        setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
      }, FADE_DURATION);

      // Retorna a limpeza para este timer interno.
      return () => clearTimeout(nextImageTimer);

    }, HOLD_DURATION); // O tempo que a imagem fica visível.

    // Função de limpeza principal: cancela todos os timers se o componente for desmontado
    // ou se o efeito for re-executado.
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(cycleTimer);
    };

  }, [currentBgIndex, backgroundImages]); // O efeito é re-executado para CADA imagem.
  // --- FIM DA CORREÇÃO ---

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      if (scrollY < windowHeight * 0.2) setShowGradientFooter(true)
      else setShowGradientFooter(false)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="flex min-h-screen relative">
      <div className="fixed top-0 left-0 w-full h-screen -z-10 overflow-hidden">
        {backgroundImages.map((imageUrl, index) => (
          <div
            key={index}
            className={`w-full h-full absolute inset-0 transition-opacity ease-in-out`}
            style={{
              opacity: index === currentBgIndex && !isFading ? 1 : 0,
              transitionDuration: `${FADE_DURATION}ms`,
            }}
          >
            <Image
              src={imageUrl}
              alt={`Background Design Vidraçaria ${index + 1}`}
              fill
              className="object-cover object-top sm:object-center"
              priority={index === 0}
              quality={100}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[var(--primary-blue-dark)]/10" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-[var(--primary-blue-dark)]" />
          </div>
        ))}
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 h-48 sm:h-56 lg:h-64 bg-gradient-to-t from-[var(--primary-blue-dark)]/70 via-[var(--primary-blue-medium)]/40 via-[var(--primary-blue-medium)]/20 to-transparent pointer-events-none z-30 transition-all duration-1000 ease-out ${
          showGradientFooter ? "opacity-100" : "opacity-0"
        }`}
      />

      <Sidebar currentPage="inicio" onToggle={setSidebarOpen} hideToggleButton={false} />

      <div
        className={`flex-1 relative z-10 w-full transition-all duration-300 ${sidebarOpen ? "ml-44 lg:ml-48" : "ml-0"}`}
      >
        <Header currentPage="inicio" />

        <div className="min-h-screen flex flex-col">
          <div className="flex-1 w-full px-3 sm:px-4 lg:px-6 xl:px-8 pt-20 sm:pt-24 max-w-full mx-auto lg:pt-0">
            <header className="text-center mb-2 sm:mb-3 animate-fadeIn relative lg:py-4">
              <div className="mb-2 max-sm:mb-1 sm:mb-0 py-0">
                <Link href="/" className="inline-block">
                  <div className="w-48 h-36 max-sm:w-56 max-sm:h-42 max-sm:-mt-8 sm:w-48 sm:h-36 md:w-56 md:h-42 lg:w-72 relative cursor-pointer hover:scale-105 transition-transform duration-300 mx-0 my-0 lg:my-2.5 lg:h-52">
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
              <main className="space-y-2 sm:space-y-3 lg:space-y-4 xl:space-y-5 mt-4 my-0 lg:-mt-12">
                <HeroSection />
                <div className="mt-12 sm:mt-[calc(4vh+40px)]">
                  <ServicesSection />
                </div>
                <div className="mb-16">
                  <BlogPreview />
                </div>
              </main>
            </header>
          </div>
          <div className="flex flex-col -mt-8">
            <SocialMedia />
            <Footer currentPage="inicio" showLogin={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
