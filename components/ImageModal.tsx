"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  currentIndex: number
  onPrevious: () => void
  onNext: () => void
}

export default function ImageModal({ isOpen, onClose, images, currentIndex, onPrevious, onNext }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowLeft":
          onPrevious()
          break
        case "ArrowRight":
          onNext()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, onPrevious, onNext])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[2000] flex items-center justify-center overflow-auto"
      onClick={onClose}
    >
      {/* Botão de Fechar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 lg:top-8 lg:right-8 text-white hover:text-[var(--secondary-blue)] transition-colors duration-300 z-20"
      >
        <X size={32} className="lg:w-10 lg:h-10" />
      </button>

      <div
        className="relative min-w-full min-h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Image
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`Imagem ${currentIndex + 1}`}
            width={0}
            height={0}
            sizes="100vw"
            className="w-auto h-auto max-w-none rounded-lg shadow-2xl"
            style={{
              maxHeight: "none",
              maxWidth: "none",
            }}
            priority
          />
        </div>
      </div>

      {/* Botões de Navegação */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPrevious()
            }}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[var(--secondary-blue)]/80 hover:bg-[var(--secondary-blue)] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl z-10"
          >
            <ChevronLeft size={24} className="lg:w-7 lg:h-7" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[var(--secondary-blue)]/80 hover:bg-[var(--secondary-blue)] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl z-10"
          >
            <ChevronRight size={24} className="lg:w-7 lg:h-7" />
          </button>
        </>
      )}

      {/* Contador de Imagens */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm lg:text-base z-10">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
