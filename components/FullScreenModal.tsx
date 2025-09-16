"use client"

import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"

interface FullScreenModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showCloseButton?: boolean
  className?: string
}

export default function FullScreenModal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  className = "",
}: FullScreenModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

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
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className={`w-full h-full bg-gradient-to-br from-[var(--primary-blue-dark)]/95 via-[var(--primary-blue-medium)]/90 to-[var(--primary-blue-light)]/95 overflow-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="sticky top-0 z-10 bg-black/20 backdrop-blur-sm border-b border-white/10 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              {title && <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{title}</h2>}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-110"
                >
                  <X size={24} className="sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  )
}
