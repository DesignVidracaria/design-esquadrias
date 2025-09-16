"use client"

import type React from "react"

import { useEffect } from "react"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
      document.documentElement.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
      document.documentElement.style.overflow = "unset"
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen min-h-screen bg-black bg-opacity-90 z-[99999] flex items-center justify-center"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        minHeight: "100vh",
        maxHeight: "100vh",
        margin: 0,
        padding: 0,
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex flex-col"
        style={{
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[100000] bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute top-4 left-4 z-[100000]">
            <h2 className="text-white text-xl font-bold">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center w-full h-full">{children}</div>
      </div>
    </div>
  )
}
