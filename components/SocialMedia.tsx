"use client"

import Link from "next/link"
import { Instagram, Youtube } from "lucide-react"

export default function SocialMedia() {
  return (
    <div className="text-center -mt-4">
      {/* Título responsivo */}
      <h3 className="text-sm sm:text-base lg:text-lg font-bold uppercase text-white tracking-widest leading-tight -mt-2">
        {"ACOMPANHE-NOS NAS REDES!"}
      </h3>

      {/* Botões sociais responsivos */}
      <div className="flex justify-center gap-3 sm:gap-4 lg:gap-5 mt-1">
        <Link
          href="https://www.instagram.com/designvidracaria"
          target="_blank"
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-[var(--secondary-blue)] to-[var(--primary-blue-medium)] flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl my-0.5"
        >
          <Instagram size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </Link>

        <Link
          href="https://www.youtube.com/designvidracaria"
          target="_blank"
          className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-[var(--secondary-blue)] to-[var(--primary-blue-medium)] flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl my-0.5"
        >
          <Youtube size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </Link>
      </div>
    </div>
  )
}
