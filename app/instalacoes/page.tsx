"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Clock, Phone, Mail, Wrench, Package, X, ChevronLeft, ChevronRight } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

// --- INÍCIO DA SEÇÃO DE DADOS E INTERFACES ---

const instalacoes = [
  {
    id: 1,
    nome: "Showroom",
    tipo: "Exposição e Atendimento",
    descricao:
      "Nosso showroom principal onde você pode conhecer nossos produtos, ver amostras de materiais e ser atendido por nossa equipe especializada.",
    endereco: "Rua Principal, 123 - Centro",
    telefone: "(33) 9 9998-8240",
    email: "marketingdesignvidracaria@gmail.com",
    horario: "Segunda a Sexta: 08:00 - 18:00",
    servicos: ["Atendimento ao cliente", "Exposição de produtos", "Orçamentos", "Consultoria técnica"],
    icone: Package,
    cor: "bg-blue-600",
    imagem: "/images/showroom.webp",
    galeria: ["/images/showroom.webp", "/images/fabrica.webp", "/images/deposito.webp"], // Galeria de exemplo
  },
  {
    id: 2,
    nome: "Fábrica",
    tipo: "Produção e Manufatura",
    descricao:
      "Nossa unidade fabril equipada com tecnologia de ponta para a produção de esquadrias de alumínio com a mais alta qualidade.",
    endereco: "Distrito Industrial, 456",
    telefone: "(33) 9 9998-8240",
    email: "producao@designvidracaria.com",
    horario: "Segunda a Sexta: 07:00 - 17:00",
    servicos: ["Produção de esquadrias", "Corte e usinagem", "Montagem", "Controle de qualidade"],
    icone: Wrench,
    cor: "bg-blue-700",
    imagem: "/images/fabrica.webp",
    galeria: ["/images/fabrica.webp", "/images/showroom.webp"], // Galeria de exemplo
  },
  {
    id: 3,
    nome: "Depósito",
    tipo: "Armazenamento e Logística",
    descricao:
      "Centro de distribuição com amplo estoque de materiais e produtos acabados, garantindo agilidade na entrega dos pedidos.",
    endereco: "Rodovia BR-123, Km 45",
    telefone: "(33) 9 9998-8240",
    email: "logistica@designvidracaria.com",
    horario: "Segunda a Sexta: 08:00 - 17:00",
    servicos: ["Armazenamento", "Expedição", "Logística", "Controle de estoque"],
    icone: Package,
    cor: "bg-blue-800",
    imagem: "/images/deposito.webp",
    galeria: [], // Galeria de exemplo
  },
]

// Interface para os dados de uma instalação
interface Instalacao {
  id: number
  nome: string
  tipo: string
  descricao: string
  endereco: string
  telefone: string
  email: string
  horario: string
  servicos: string[]
  icone: React.ElementType
  cor: string
  imagem: string
  galeria?: string[]
}

// Interface para as propriedades do novo modal
interface InstalacaoModalProps {
  isOpen: boolean
  onClose: () => void
  item: Instalacao | null
}

// --- FIM DA SEÇÃO DE DADOS E INTERFACES ---


// --- INÍCIO DO NOVO COMPONENTE MODAL ---

function InstalacaoModal({ isOpen, onClose, item }: InstalacaoModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Reseta a imagem selecionada quando o item do modal muda
  useEffect(() => {
    setSelectedImageIndex(0)
  }, [item])

  if (!isOpen || !item) return null

  const allImages = [item.imagem, ...(item.galeria || [])].filter(Boolean)

  const handleNextImage = () => {
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % allImages.length)
  }

  const handlePrevImage = () => {
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
          <h2 className="text-2xl font-bold text-white">{item.nome}</h2>
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
              alt={`${item.nome} ${selectedImageIndex + 1}`}
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
          <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-left">{item.descricao}</p>
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
                  alt={`${item.nome} ${index + 1}`}
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

// --- FIM DO NOVO COMPONENTE MODAL ---


export default function InstalacoesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [selectedInstalacao, setSelectedInstalacao] = useState<Instalacao | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Bloqueia rolagem do body quando o modal está aberto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  // Fecha o modal com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openModal = (instalacao: Instalacao) => {
    setSelectedInstalacao(instalacao);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedInstalacao(null), 300);
  };

  return (
    <div className="flex min-h-screen relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-65 animate-pulse-slow"
        style={{
          backgroundImage: "url('/BG.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--primary-blue-dark)]/30 via-transparent to-[var(--primary-blue-light)]/30" />
      
      <Sidebar currentPage="instalacoes" onToggle={setSidebarOpen} hideToggleButton={showModal} />

      <div
        className={`flex-1 relative z-10 w-full transition-all duration-300 ${sidebarOpen ? "ml-44 lg:ml-48" : "ml-0"}`}
      >
        {!showModal && <Header currentPage="instalacoes" onHeaderToggle={setHeaderVisible} />}
        
        <main>
          {/* --- INÍCIO DA CORREÇÃO --- */}
          {/* A classe 'pt-12' foi movida para o <header> para garantir o espaçamento em todas as telas */}
          <div className="container mx-auto px-4 py-4 max-sm:py-2">
            <header className="text-center mb-6 max-sm:mb-3 animate-fadeIn pt-12">
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
                Conheça nossas unidades: Showroom, Fábrica e Depósito
              </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-sm:gap-4 mb-6 max-sm:mb-3 animate-fadeIn">
              {instalacoes.map((instalacao, index) => {
                const Icon = instalacao.icone
                return (
                  <div
                    key={instalacao.id}
                    className="glass-effect rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => openModal(instalacao)}
                  >
                    <div
                      className="relative h-64 overflow-hidden cursor-pointer group"
                    >
                      <Image
                        src={instalacao.imagem || "/placeholder.svg"}
                        alt={instalacao.nome}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div
                        className={`absolute top-4 left-4 ${instalacao.cor} text-white px-3 py-1 rounded-full text-sm font-medium`}
                      >
                        {instalacao.nome}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className={`${instalacao.cor} p-6 text-white`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{instalacao.nome}</h3>
                          <p className="text-white/90 text-sm">{instalacao.tipo}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-white/90 leading-relaxed mb-6">{instalacao.descricao}</p>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-white/80">
                          <MapPin size={16} className="text-[var(--secondary-blue)]" />
                          <span className="text-sm">{instalacao.endereco}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                          <Phone size={16} className="text-[var(--secondary-blue)]" />
                          <span className="text-sm">{instalacao.telefone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                          <Mail size={16} className="text-[var(--secondary-blue)]" />
                          <span className="text-sm break-all">{instalacao.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                          <Clock size={16} className="text-[var(--secondary-blue)]" />
                          <span className="text-sm">{instalacao.horario}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold mb-3">Serviços:</h4>
                        <ul className="space-y-2">
                          {instalacao.servicos.map((servico, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-white/80 text-sm">
                              <div className="w-1.5 h-1.5 bg-[var(--secondary-blue)] rounded-full" />
                              {servico}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="glass-effect rounded-2xl p-8 max-sm:p-4 border border-white/20 text-center animate-fadeIn">
              <h2 className="text-3xl font-bold text-white mb-6">Visite Nossas Instalações</h2>
              <p className="text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
                Nossas três unidades trabalham em conjunto para oferecer a melhor experiência aos nossos clientes. Do
                showroom onde você conhece nossos produtos, passando pela fábrica onde tudo é produzido com qualidade, até
                o depósito que garante a entrega rápida e segura.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <Clock className="text-[var(--secondary-blue)]" size={20} />
                  <span className="text-white">Atendimento personalizado</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <Phone className="text-[var(--secondary-blue)]" size={20} />
                  <span className="text-white">Agendamento disponível</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <InstalacaoModal isOpen={showModal} onClose={closeModal} item={selectedInstalacao} />

        <Footer currentPage="instalacoes" showLogin={true} />
      </div>
    </div>
    // --- FIM DA CORREÇÃO ---
  )
}
