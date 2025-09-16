"use client"

// Adicionado 'useEffect' na importação do React
import { useState, Suspense, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Award, Users, TrendingUp, Heart, Star, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

// ===================================================================================
// CÓDIGO DO MODAL (SEM ALTERAÇÕES)
// ===================================================================================
interface ModalDisplayItem {
  titulo: string
  descricao: string
  imagem_principal: string
  galeria?: string[]
}
interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  item: ModalDisplayItem | null
}
function ProductModal({ isOpen, onClose, item }: ProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  useEffect(() => {
    setSelectedImageIndex(0)
  }, [item])
  if (!isOpen || !item) {
    return null
  }
  const allImages = [item.imagem_principal, ...(item.galeria || [])].filter(Boolean)
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedImageIndex((prevIndex) => (prevIndex + 1) % allImages.length)
  }
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
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
          <h2 className="text-2xl font-bold text-white">{item.titulo}</h2>
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
              alt={`${item.titulo} ${selectedImageIndex + 1}`}
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
          <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
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
                  alt={`${item.titulo} thumbnail ${index + 1}`}
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
// ===================================================================================
// FIM DO CÓDIGO DO MODAL
// ===================================================================================

const timeline = [
  {
    ano: "2015",
    titulo: "Abertura da Design Vidraçaria em sociedade",
    descricao:
      "A Design Vidraçaria em sociedade foi fundada com o objetivo de oferecer soluções inovadoras em esquadrias de alumínio e vidro.",
    icone: Heart,
  },
  {
    ano: "2018",
    titulo: "A Independência da Empresa",
    descricao:
      "Neste ano, encerrava-se a sociedade entre os proprietários e Luiz com seu perfil empreendedor, compra a parte do ex-sócio. Também neste mesmo ano, Regina sai da empresa onde trabalhava e começa a trabalhar com Luiz para juntos crescerem o negócio.",
    icone: Award,
  },
  {
    ano: "2019",
    titulo: "Os Primeiros Passos",
    descricao:
      "Juntos, Luiz e Regina perceberam a necesidade de buscar ajuda para o mundo dos negócios, afim de garantir mais crescimento para a empresa. Com isso, foram em busca de emocional e de gestão. Começava aqui, uma nova jornada na história da Design Vidraçaria. Os atuais donos entenderam que para ser grande é preciso investir em conhecimento e capacitação.",
    icone: Users,
  },
  {
    ano: "2019",
    titulo: "Certificação de Qualidade",
    descricao:
      "Também em 2019, Luiz fez seu primeiro curso de especialização em esquadrias de alumínio, levando junto com ele um de seus funcionários, pois já tinha a mentalidade de compartilhar aquilo que sabia e aprendia.",
    icone: Star,
  },
  {
    ano: "2020",
    titulo: "Adaptando ao Mundo Moderno",
    descricao:
      "Em 2020, o mundo todo passou por um susto grande com uma pandemia e, com a empresa não foi diferente. Houve o receio de ter que fechar por conta da quarentena, com isso o risco de demissão poderia ocorrer, mas com todos os desafios, a empresa conseguiu seguir em frente e cumprir com todas as suas obrigações e honrar com seus compromissos.",
    icone: TrendingUp,
  },
  {
    ano: "2023",
    titulo: "Liderança no Mercado",
    descricao:
      "Consolidamos nossa posição como referência em esquadrias de alumínio na região, com mais de 500 projetos realizados.",
    icone: Award,
  },
]

const valores = [
  {
    titulo: "Qualidade",
    descricao:
      "Utilizamos apenas materiais de primeira linha e seguimos os mais altos padrões de qualidade em todos os nossos projetos.",
    icone: Star,
  },
  {
    titulo: "Inovação",
    descricao:
      "Estamos sempre em busca de novas tecnologias e soluções para oferecer o que há de mais moderno no mercado.",
    icone: TrendingUp,
  },
  {
    titulo: "Compromisso",
    descricao: "Nosso compromisso é com a satisfação total do cliente, cumprindo prazos e superando expectativas.",
    icone: Heart,
  },
  {
    titulo: "Experiência",
    descricao:
      "Com mais de 15 anos de experiência, temos o conhecimento necessário para realizar projetos de qualquer complexidade.",
    icone: Award,
  },
]

function HistoriaContent({ onImageClick }: { onImageClick: (item: ModalDisplayItem) => void }) {
  return (
    <div className="container mx-auto px-4 py-4 max-sm:py-2">
      <header className="text-center mb-6 max-sm:mb-3 animate-fadeIn pt-12">
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
          Somos mais do que uma vidraçaria!
        </p>
      </header>

      <section className="glass-effect rounded-2xl p-8 max-sm:p-4 lg:p-12 border border-white/20 mb-6 max-sm:mb-3 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Quem Somos</h2>
            <div className="space-y-4 text-white/90 leading-relaxed">
              <p>
                Nos diferenciamos pela inovação e tecnologia que sempre estiveram presentes no nosso negócio e à
                frente do mercado.
              </p>
              <p>
                Nossa equipe é formada por profissionais experientes e apaixonados pelo que fazem. Cada projeto é
                tratado com cuidado especial, desde o planejamento até a instalação final, garantindo um atendimento
                humanizado, próximo e respeitoso com nossos clientes.
              </p>
              <p>
                Ao longo dos anos, construímos uma reputação sólida baseada na confiança, qualidade e inovação.
                Hoje, somos referência no mercado de esquadrias de alumínio, com centenas de projetos realizados e
                clientes satisfeitos, afinal, eles são para nós, a razão de existir da nossa empresa.
              </p>
            </div>
          </div>
          <div className="relative">
            <div
              className="aspect-square relative rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() =>
                onImageClick({
                  titulo: "Quem Somos",
                  descricao: "Nossa equipe e escritório.",
                  imagem_principal: "/IMG1.png",
                  galeria: ["/IMG1.png"],
                })
              }
            >
              <Image
                src="/IMG1.png"
                alt="Design Vidraçaria - Projeto Residencial"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <Eye className="text-white" size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 max-sm:mb-3 animate-fadeIn">
        <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-12 max-sm:mb-6">
          Nossa Trajetória
        </h2>
        <div className="relative">
          <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-0.5 bg-[var(--secondary-blue)] transform lg:-translate-x-1/2"></div>
          <div className="space-y-8 max-sm:space-y-4">
            {timeline.map((item, index) => {
              const Icon = item.icone
              return (
                <div
                  key={index}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  } flex-row`}
                >
                  <div className="absolute left-4 lg:left-1/2 w-8 h-8 bg-[var(--secondary-blue)] rounded-full flex items-center justify-center transform lg:-translate-x-1/2 z-10">
                    <Icon className="text-white" size={16} />
                  </div>
                  <div
                    className={`glass-effect rounded-2xl p-6 border border-white/20 ml-16 lg:ml-0 ${
                      index % 2 === 0 ? "lg:mr-8 lg:ml-0" : "lg:ml-8 lg:mr-0"
                    } lg:w-5/12 hover:scale-105 transition-transform duration-300`}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-2xl font-bold text-[var(--secondary-blue)]">{item.ano}</span>
                      <Calendar className="text-white/60" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.titulo}</h3>
                    <p className="text-white/80 leading-relaxed">{item.descricao}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mb-6 max-sm:mb-3 animate-fadeIn">
        <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-12 max-sm:mb-6">Nossos Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-sm:gap-4">
          {valores.map((valor, index) => {
            const Icon = valor.icone
            return (
              <div
                key={index}
                className="glass-effect rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 group text-center"
              >
                <div className="w-16 h-16 bg-[var(--secondary-blue)] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[var(--secondary-blue)] transition-colors">
                  {valor.titulo}
                </h3>
                <p className="text-white/80 leading-relaxed">{valor.descricao}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-sm:gap-4 animate-fadeIn">
        <div className="glass-effect rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 text-center">
          <div className="w-16 h-16 bg-[var(--secondary-blue)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Missão</h3>
          <p className="text-white/80 leading-relaxed">
            Garantir soluções em esquadrias e execuções de projetos especiais que tragam inspiração e bem-estar para
            famíliar e empresas com seus designs inovadores e qualidade na prestação de serviço.
          </p>
        </div>
        <div className="glass-effect rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 text-center">
          <div className="w-16 h-16 bg-[var(--secondary-blue)] rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Visão</h3>
          <p className="text-white/80 leading-relaxed">
            Ser reconhecida como a principal referência em esquadrias de alumínio e vidro, expandindo nossa atuação
            e mantendo a excelência.
          </p>
        </div>
        <div className="glass-effect rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 text-center">
          <div className="w-16 h-16 bg-[var(--secondary-blue)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Star className="text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Valores</h3>
          <p className="text-white/80 leading-relaxed">
            Ética: Para nós, o certo é o certo e a ética é inegociável. Honestidade: Somos honestos em nossas
            relações interpessoais colocando em prática nosso compromisso com a verdade sempre de forma educada e
            respeitosa. Compromisso com prazo e qualidade: Focamos em cumprir nossos compromissos no prazo
            realizando serviços com máxima qualidade e consistência como se fosse para alguém de nossa família.
            Respeito: Temos consideração pelo sentimento dos outros e tratamos as pessoas dentro e fora da empresa,
            com grande atenção, zelo, apreço e profunda deferência. Inovação: Atuamos com as melhores e mais novas
            soluções do mercado sendo pioneira na inocação de produtos e soluções modernas e sofisticadas no mercado
            vidreiro.
          </p>
        </div>
      </section>
    </div>
  )
}

export default function HistoriaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ModalDisplayItem | null>(null)

  const handleImageClick = (item: ModalDisplayItem) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedItem(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[var(--primary-blue-light)] via-[var(--primary-blue-medium)] to-[var(--primary-blue-dark)] relative overflow-x-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-65 animate-pulse-slow"
        style={{
          backgroundImage: "url('/BG.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--primary-blue-dark)]/30 via-transparent to-[var(--primary-blue-light)]/30 my-0" />

      {/* --- INÍCIO DA CORREÇÃO --- */}
      {/* A estrutura foi alterada para espelhar a da página Home. */}
      <Sidebar currentPage="historia" onToggle={setSidebarOpen} hideToggleButton={showModal} />

      <div
        className={`flex-1 relative z-10 w-full transition-all duration-300 ${sidebarOpen ? "ml-44 lg:ml-48" : "ml-0"}`}
      >
        {!showModal && <Header currentPage="historia" onHeaderToggle={setHeaderVisible} sidebarOpen={sidebarOpen} />}
        
        <main>
          <Suspense
            fallback={
              <div className="container mx-auto px-4 py-8 text-center text-white/80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                Carregando conteúdo...
              </div>
            }
          >
            <HistoriaContent onImageClick={handleImageClick} />
          </Suspense>
        </main>
      </div>
      {/* --- FIM DA CORREÇÃO --- */}

      <ProductModal isOpen={showModal} onClose={closeModal} item={selectedItem} />

      <Footer currentPage="historia" showLogin={true} />
    </div>
  )
}
