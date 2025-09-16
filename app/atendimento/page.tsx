"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Phone, Clock, Mail, Copy, CheckCircle } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

export default function AtendimentoPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const phoneNumber = "(33) 9 9998-8240"
  const email = "marketingdesignvidracaria@gmail.com"
  const whatsappNumber = "5533999988240"

  const businessHours = [
    { day: "Segunda-feira", hours: "08:00 - 18:00", isOpen: true },
    { day: "Terça-feira", hours: "08:00 - 18:00", isOpen: true },
    { day: "Quarta-feira", hours: "08:00 - 18:00", isOpen: true },
    { day: "Quinta-feira", hours: "08:00 - 18:00", isOpen: true },
    { day: "Sexta-feira", hours: "08:00 - 18:00", isOpen: true },
  ]

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "phone") {
        setCopiedPhone(true)
        setTimeout(() => setCopiedPhone(false), 2000)
      } else {
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      }
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  const getCurrentStatus = () => {
    const now = new Date()
    const currentDay = now.getDay() // 0 = domingo, 1 = segunda, etc.
    const currentHour = now.getHours()

    if (currentDay >= 1 && currentDay <= 5) {
      if (currentHour >= 8 && currentHour < 18) {
        return { isOpen: true, message: "EM FUNCIONAMENTO" }
      }
    }

    return { isOpen: false, message: "Estamos FECHADOS no momento" }
  }

  const status = getCurrentStatus()

  function AtendimentoContent() {
    return (
      <div className="container mx-auto px-4 py-4 max-sm:py-2">
        <header className="text-center mb-6 max-sm:mb-3 animate-fadeIn pt-12 sm:pt-0">
          <div className="mb-2 max-sm:mb-1 sm:mb-0 py-0">
            <Link href="/" className="inline-block">
              <div className="w-48 h-36 max-sm:w-56 max-sm:h-42 max-sm:-mt-8 sm:w-48 sm:h-36 md:w-56 md:h-42 lg:w-64 relative cursor-pointer hover:scale-105 transition-transform duration-300 mx-0 lg:h-48 my-2.5">
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
            Entre em contato conosco e tire as suas dúvidas sobre nossos serviços
          </p>
        </header>

        <div className="glass-effect rounded-2xl p-6 max-sm:p-4 mb-3 max-sm:mb-2 border border-white/20 text-center animate-fadeIn">
          <div
            className={`inline-flex items-center gap-3 px-6 py-3 rounded-full font-bold text-lg ${
              status.isOpen
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${status.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
            {status.message}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-sm:gap-4 mb-4 max-sm:mb-2 animate-fadeIn">
          <div className="glass-effect rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 group">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Phone className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">WhatsApp</h2>
              <p className="text-white/80">Fale conosco pelo WhatsApp</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                <span className="text-white font-mono text-lg">{phoneNumber}</span>
                <button
                  onClick={() => copyToClipboard(phoneNumber, "phone")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copiedPhone ? (
                    <CheckCircle className="text-green-400" size={20} />
                  ) : (
                    <Copy className="text-white/60" size={20} />
                  )}
                </button>
              </div>

              <Link
                href={`https://wa.me/${whatsappNumber}?text=Olá! Gostaria de saber mais sobre os serviços da Design Vidraçaria.`}
                target="_blank"
                className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 hover:scale-105 text-center"
              >
                Abrir WhatsApp
              </Link>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 group">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[var(--secondary-blue        )] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mail className="text-white" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">E-mail</h2>
              <p className="text-white/80">Envie sua mensagem por e-mail</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                <span className="text-white text-sm break-all">{email}</span>
                <button
                  onClick={() => copyToClipboard(email, "email")}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  {copiedEmail ? (
                    <CheckCircle className="text-green-400" size={20} />
                  ) : (
                    <Copy className="text-white/60" size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-6 max-sm:p-4 mb-3 max-sm:mb-2 border border-white/20 animate-fadeIn">
          <div className="flex items-center justify-center gap-4">
            <span className="text-white text-xl font-bold">SAC: (33) 3331 - 5632</span>
            <button
              onClick={() => copyToClipboard("(33) 3331 - 5632", "phone")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Copiar número do SAC"
            >
              {copiedPhone ? (
                <CheckCircle className="text-green-400" size={20} />
              ) : (
                <Copy className="text-white/60" size={20} />
              )}
            </button>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-8 max-sm:p-4 border border-white/20 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--secondary-blue)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Horário de Funcionamento</h2>
            <p className="text-white/80">Confira nossos horários de atendimento</p>
          </div>

          <div className="max-w-md mx-auto space-y-3">
            {businessHours.map((schedule, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/10 rounded-lg border border-white/20"
              >
                <span className="text-white font-medium">{schedule.day}</span>
                <span className={`font-bold ${schedule.isOpen ? "text-green-400" : "text-white/60"}`}>
                  {schedule.hours}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    // --- INÍCIO DA CORREÇÃO ---
    // A estrutura foi alterada para espelhar a da página Home.
    <div className="flex min-h-screen relative">
      <Sidebar currentPage="atendimento" onToggle={setSidebarOpen} />

      <div
        className={`flex-1 relative z-10 w-full transition-all duration-300 ${sidebarOpen ? "ml-44 lg:ml-48" : "ml-0"}`}
      >
        <Header currentPage="atendimento" onHeaderToggle={setHeaderVisible} />

        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--primary-blue-light)] via-[var(--primary-blue-medium)] to-[var(--primary-blue-dark)] relative overflow-x-hidden">
          <Suspense
            fallback={
              <main className="container mx-auto px-4 py-8 text-center text-white/80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                Carregando conteúdo...
              </main>
            }
          >
            <AtendimentoContent />
          </Suspense>

          <div className="flex-grow"></div>
          <div className="relative z-40 mt-auto">
            <Footer currentPage="atendimento" showLogin={true} />
          </div>
        </div>
      </div>
    </div>
    // --- FIM DA CORREÇÃO ---
  )
}
