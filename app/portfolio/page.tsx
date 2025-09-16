"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"

// ... (Interfaces e Componente ProductModal permanecem os mesmos) ...

interface PortfolioItem {
  id: string
  titulo: string
  secao: string
  descricao: string
  imagem_principal: string
  galeria?: string[]
  created_at: string
  cores?: string[]
  ordem?: number
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  item: PortfolioItem | null
}

interface Secao {
  nome: string
  titulo_exibicao: string
  icone: string
}

function ProductModal({ isOpen, onClose, item }: ProductModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!isOpen || !item) return null

  const allImages = [item.imagem_principal, ...(item.galeria || [])].filter(Boolean)

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
              src={allImages[selectedImageIndex] || "/placeholder.svg?height=400&width=600"}
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

        {item.cores && item.cores.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3 text-center">Cores Disponíveis:</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {item.cores.map((cor, index) => (
                <span
                  key={index}
                  className="bg-white/10 text-white px-3 py-1 rounded-full text-sm border border-white/20"
                >
                  {cor}
                </span>
              ))}
            </div>
          </div>
        )}

        {allImages.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {allImages.slice(0, 4).map((image, index) => (
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
                  src={image || "/placeholder.svg?height=80&width=120"}
                  alt={`${item.titulo} ${index + 1}`}
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


export default function PortfolioPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [secoes, setSecoes] = useState<Secao[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    const fetchSecoes = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("secoes")
          .select("nome, titulo_exibicao, icone")
          .order("ordem", { ascending: true })

        if (error) {
          console.error("Error fetching sections:", error)
          setSecoes([])
        } else {
          setSecoes(data || [])
        }
      } catch (error) {
        console.error("General error fetching sections:", error)
        setSecoes([])
      }
      setLoading(false)
    }

    fetchSecoes()
  }, [])

  useEffect(() => {
    const fetchPortfolioItems = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("portfolio_items").select("*").order("ordem", { ascending: true })

        if (error) {
          console.error("Error fetching portfolio items:", error)
          setPortfolioItems([])
        } else {
          setPortfolioItems(data || [])
        }
      } catch (error) {
        console.error("General error fetching portfolio items:", error)
        setPortfolioItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioItems()
  }, [])

  useEffect(() => {
    if (!loading && secoes.length > 0) {
      const sectionsToCollapse = secoes.slice(1).map((s) => s.nome)
      setCollapsedSections(new Set(sectionsToCollapse))
    }
  }, [loading, secoes])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (hash) {
        const targetElement = document.getElementById(hash)
        if (targetElement) {
          const itemToOpen = portfolioItems.find((item) => item.id === hash)
          if (itemToOpen) {
            setCollapsedSections((prev) => {
              const newCollapsed = new Set(prev)
              newCollapsed.delete(itemToOpen.secao)
              return newCollapsed
            })
            targetElement.scrollIntoView({ behavior: "smooth" })
          }
        }
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [portfolioItems, secoes])

  const getItemsBySection = (sectionValue: string) => {
    return portfolioItems.filter((item) => item.secao === sectionValue)
  }

  const openModal = (item: PortfolioItem) => {
    setSelectedItem(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedItem(null)
  }

  const toggleSection = (sectionValue: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionValue)) {
      newCollapsed.delete(sectionValue)
    } else {
      newCollapsed.add(sectionValue)
    }
    setCollapsedSections(newCollapsed)
  }

  const loadImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Error loading image:", error)
      return ""
    }
  }

  const generatePortfolioPDF = async () => {
    setGeneratingPdf(true)

    try {
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin

      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage()
          addHeaderAndFooter()
          yPosition = margin + 25
          return true
        }
        return false
      }

      const addHeaderAndFooter = async () => {
        pdf.setFillColor(57, 100, 150)
        pdf.rect(0, 0, pageWidth, 25, "F")

        try {
          const logoBase64 = await loadImageAsBase64("/LOGO.png")
          if (logoBase64) {
            const tempImg = new window.Image()
            tempImg.src = logoBase64
            await new Promise((resolve) => (tempImg.onload = resolve))

            const logoWidth = tempImg.width
            const logoHeight = tempImg.height

            const maxHeight = 15
            const maxWidth = 20

            let scaledWidth = maxWidth
            let scaledHeight = (logoHeight * maxWidth) / logoWidth

            if (scaledHeight > maxHeight) {
              scaledHeight = maxHeight
              scaledWidth = (logoWidth * maxHeight) / logoHeight
            }

            const logoX = margin + (maxWidth - scaledWidth) / 2
            const logoY = 5 + (maxHeight - scaledHeight) / 2
            pdf.addImage(logoBase64, "PNG", margin, logoY, scaledWidth, scaledHeight)
          }
        } catch (error) {
          console.error("Error loading logo:", error)
        }

        pdf.setFontSize(16)
        pdf.setFont("helvetica", "bold")
        pdf.setTextColor(255, 255, 255)
        const titleWidth = pdf.getTextWidth("PORTFOLIO")
        pdf.text("PORTFOLIO", (pageWidth - titleWidth) / 2, 15)

        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        const subtitle = "marketingdesignvidracaria@gmail.com / (33) 99998 - 8240"
        const subtitleWidth = pdf.getTextWidth(subtitle)
        pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, 20)

        pdf.setFillColor(57, 100, 150)
        pdf.rect(0, pageHeight - 15, pageWidth, 15, "F")

        pdf.setFontSize(8)
        pdf.setFont("helvetica", "normal")
        pdf.setTextColor(255, 255, 255)
        const footerText = "© 2025 Design Vidraçaria. All rights reserved."
        const footerWidth = pdf.getTextWidth(footerText)
        pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 8)

        pdf.setTextColor(0, 0, 0)
      }

      await addHeaderAndFooter()
      yPosition = margin + 25

      for (const secao of secoes) {
        const sectionItems = getItemsBySection(secao.nome)

        if (sectionItems.length === 0) continue

        checkPageBreak(80)

        pdf.setFontSize(18)
        pdf.setFont("helvetica", "bold")

        const sectionTitleWidth = pdf.getTextWidth(secao.titulo_exibicao)
        const textPadding = 10
        const rectWidth = sectionTitleWidth + textPadding * 2
        const rectX = (pageWidth - rectWidth) / 2
        const rectY = yPosition - 7
        const rectHeight = 10

        pdf.setFillColor(57, 100, 150)
        pdf.roundedRect(rectX, rectY, rectWidth, rectHeight, 3, 3, "F")

        pdf.setTextColor(255, 255, 255)
        pdf.text(secao.titulo_exibicao, (pageWidth - sectionTitleWidth) / 2, yPosition)

        yPosition += 15

        for (const item of sectionItems) {
          pdf.setTextColor(0, 0, 0)

          checkPageBreak(80)

          const imgUrl = item.imagem_principal
          const imgSize = 60

          if (imgUrl) {
            try {
              const imageBase64 = await loadImageAsBase64(imgUrl)
              if (imageBase64) {
                const tempImg = new window.Image()
                tempImg.src = imageBase64
                await new Promise((resolve) => (tempImg.onload = resolve))

                const imageWidth = tempImg.width
                const imageHeight = tempImg.height

                const maxWidth = imgSize
                const maxHeight = imgSize

                let scaledWidth = maxWidth
                let scaledHeight = (imageHeight * maxWidth) / imageWidth

                if (scaledHeight > maxHeight) {
                  scaledHeight = maxHeight
                  scaledWidth = (imageWidth * maxHeight) / imageHeight
                }

                pdf.addImage(
                  imageBase64,
                  "JPEG",
                  margin,
                  yPosition + (maxHeight - scaledHeight) / 2,
                  scaledWidth,
                  scaledHeight,
                )

                pdf.setFontSize(14)
                pdf.setFont("helvetica", "bold")
                pdf.setTextColor(0, 0, 0)
                pdf.text(item.titulo, margin + maxWidth + 10, yPosition + 10)

                pdf.setFontSize(10)
                pdf.setFont("helvetica", "normal")
                const splitDescription = pdf.splitTextToSize(
                  item.descricao,
                  pageWidth - margin - (margin + maxWidth + 10),
                )
                pdf.text(splitDescription, margin + maxWidth + 10, yPosition + 20)

                yPosition += maxHeight + 10
              }
            } catch (error) {
              console.error("Error processing image for PDF:", error)
            }
          } else {
            pdf.setFontSize(14)
            pdf.setFont("helvetica", "bold")
            pdf.setTextColor(0, 0, 0)
            pdf.text(item.titulo, margin, yPosition + 10)

            pdf.setFontSize(10)
            pdf.setFont("helvetica", "normal")
            pdf.setTextColor(0, 0, 0)
            const splitDescription = pdf.splitTextToSize(item.descricao, pageWidth - margin - 80)
            pdf.text(splitDescription, margin, yPosition + 20)

            yPosition += 80
          }
        }

        yPosition += 10
      }

      pdf.save("portfolio-design-vidracaria.pdf")
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-blue-light)] via-[var(--primary-blue-medium)] to-[var(--primary-blue-dark)] relative overflow-x-hidden">
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

      <Header currentPage="portfolio" onHeaderToggle={setHeaderVisible} />
      <Sidebar currentPage="portfolio" onToggle={setSidebarOpen} hideToggleButton={showModal} />

      <main
        className={`relative z-10 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-44 lg:ml-48" : "ml-0"
        } pt-0`}
      >
        <div className="container mx-auto px-4 py-4 max-sm:py-2">
          {/* --- INÍCIO DA CORREÇÃO --- */}
          {/* A classe 'pt-12' desce o conteúdo no mobile, e 'sm:pt-0' reseta para telas maiores */}
          <header className="text-center mb-6 max-sm:mb-3 animate-fadeIn pt-12 sm:pt-0">
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
              Conheça nossos projetos realizados e a qualidade dos nossos serviços
            </p>
          </header>
          {/* --- FIM DA CORREÇÃO --- */}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/80">Carregando projetos...</p>
            </div>
          )}

          <div className="max-w-6xl mx-auto space-y-6 max-sm:space-y-3 animate-fadeIn">
            {!loading && (
              <>
                {secoes.map((secao) => {
                  const items = getItemsBySection(secao.nome)
                  const isCollapsed = collapsedSections.has(secao.nome)

                  return (
                    <div key={secao.nome} className="glass-effect rounded-xl border border-white/20">
                      <div
                        className="p-6 cursor-pointer hover:bg-white/5 transition-all duration-300 rounded-xl"
                        onClick={() => toggleSection(secao.nome)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {secao.icone && secao.icone.trim() !== "" && (
                              <img
                                src={secao.icone || "/placeholder.svg"}
                                alt={`Ícone ${secao.titulo_exibicao}`}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none"
                                }}
                              />
                            )}
                            <div>
                              <h4 className="text-2xl font-bold text-white">{secao.titulo_exibicao}</h4>
                              <p className="text-white/60 text-sm">
                                {items.length === 0
                                  ? "Nenhum produto ainda"
                                  : `${items.length} ${items.length === 1 ? "produto" : "produtos"}`}
                              </p>
                            </div>
                          </div>
                          <div className="ml-4">
                            {isCollapsed ? (
                              <ChevronDown className="text-white" size={24} />
                            ) : (
                              <ChevronUp className="text-white" size={24} />
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${
                          isCollapsed ? "max-h-0 opacity-0" : "max-h-[3000px] opacity-100"
                        }`}
                      >
                        {items.length === 0 ? (
                          <div className="px-6 pb-6">
                            <div className="text-center py-8 bg-white/5 rounded-lg">
                              <p className="text-white/60">Nenhum produto nesta categoria ainda.</p>
                              <p className="text-white/40 text-sm mt-2">Novos produtos serão adicionados em breve!</p>
                            </div>
                          </div>
                        ) : (
                          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                id={item.id}
                                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                              >
                                <div className="flex flex-col gap-3">
                                  <div className="w-full h-40 rounded-lg overflow-hidden">
                                    <Image
                                      src={item.imagem_principal || "/placeholder.svg?height=160&width=240"}
                                      alt={item.titulo}
                                      width={240}
                                      height={160}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="text-white font-bold text-base mb-2">{item.titulo}</h5>
                                    <p className="text-white/60 text-xs mb-3 line-clamp-2">{item.descricao}</p>
                                    {item.cores && item.cores.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-white/70 text-xs mb-1">Cores disponíveis:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {item.cores.slice(0, 3).map((cor, index) => (
                                            <span
                                              key={index}
                                              className="text-xs px-2 py-1 rounded text-white bg-slate-400"
                                            >
                                              {cor}
                                            </span>
                                          ))}
                                          {item.cores.length > 3 && (
                                            <span className="text-white/60 text-xs">+{item.cores.length - 3}</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    <p className="text-white/50 text-xs mb-3">
                                      {(item.galeria?.length || 0) + 1} imagens disponíveis
                                    </p>
                                    <button
                                      onClick={() => openModal(item)}
                                      className="w-full hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2 bg-slate-700"
                                    >
                                      <Eye size={16} />
                                      VER DETALHES
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="text-center mt-6 max-sm:mt-3 mb-4 max-sm:mb-2">
                  <button
                    onClick={generatePortfolioPDF}
                    disabled={generatingPdf}
                    className="disabled:bg-red-400 px-8 py-4 rounded-lg text-lg font-bold transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none text-white"
                    style={{
                      backgroundColor: "#396496",
                    }}
                    onMouseEnter={(e) => {
                      if (!generatingPdf) {
                        e.currentTarget.style.backgroundColor = "#4c93e3"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!generatingPdf) {
                        e.currentTarget.style.backgroundColor = "#396496"
                      }
                    }}
                  >
                    <Download size={24} />
                    {generatingPdf ? "GERANDO PDF..." : "BAIXAR EM PDF"}
                  </button>
                  {generatingPdf && (
                    <p className="text-white/60 text-sm mt-2">Processando imagens e gerando arquivo PDF...</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <ProductModal isOpen={showModal} onClose={closeModal} item={selectedItem} />

      <Footer currentPage="portfolio" showLogin={true} />
    </div>
  )
}
