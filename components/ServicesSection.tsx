"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2, AlertCircle, RefreshCw, ArrowRight } from "lucide-react" // Adicionado ArrowRight
import { supabase } from "@/lib/supabase"

/**
 * Interface para definir a estrutura de um item do portfólio.
 * Corresponde à estrutura da tabela `portfolio_items` no Supabase.
 */
interface PortfolioItem {
  id: string
  titulo: string
  descricao: string
  imagem_principal: string
  secao: string
  created_at: string
  fixado: boolean
}

/**
 * @description
 * Componente da seção de serviços que exibe os itens mais recentes do portfólio.
 * Ele agora se conecta ao Supabase para obter os dados em tempo real.
 */
export default function ServicesSection() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPortfolioItems = async () => {
    try {
      setLoading(true)
      setError(null)

      // Test database connection first
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("id, titulo, descricao, imagem_principal, secao, created_at, fixado")
        .eq("ativo", true) // Only get active items
        .eq("fixado", true) // Only get pinned items
        .order("ordem", { ascending: true }) // Order by ordem first
        .order("created_at", { ascending: false }) // Then by creation date
        .limit(3) // Show more items

      if (error) {
        console.error("Erro ao buscar itens do portfólio:", error)
        setError(`Erro ao carregar os serviços: ${error.message}`)
        setItems([])
      } else {
        // Assegura que os dados existam antes de atualizar o estado
        setItems(data || [])
      }
    } catch (e) {
      console.error("Erro geral ao buscar itens do portfólio:", e)
      setError("Ocorreu um erro inesperado ao conectar ao banco de dados.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Busca os itens do portfólio do Supabase na montagem do componente.
  useEffect(() => {
    fetchPortfolioItems()
  }, [])

  return (
    <section className="mb-4 sm:mb-6 lg:mb-8 -mt-[50px]">
      {/* --- INÍCIO DA ALTERAÇÃO --- */}
      {/* A margem inferior (mb) foi reduzida para diminuir o espaço entre o título e o grid */}
      <h2 className="text-base sm:text-lg font-bold text-center mb-6 sm:mb-8 uppercase tracking-wide relative text-white px-2 xl:text-5xl lg:text-5xl max-sm:mt-32 lg:mb-14 mt-0">
        CONFIRA NOSSO PORTFÓLIO
        <div className="w-12 sm:w-16 lg:w-24 h-0.5 sm:h-1 bg-gradient-to-r from-[var(--secondary-blue)] to-transparent mx-auto mt-4 sm:mt-5 rounded-full lg:mt-3" />
      </h2>
      {/* --- FIM DA ALTERAÇÃO --- */}

      {/* Exibe o estado de carregamento ou erro */}
      {loading && (
        <div className="text-center py-12 text-white">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
          <p className="text-white/80">Carregando projetos...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-400">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchPortfolioItems}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py harbor freight tools 2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Grid responsivo para exibir os itens do portfólio se não houver carregamento ou erro */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 px-1 sm:px-2 lg:px-0">
            {items.length === 0 ? (
              <div className="col-span-full text-center py-12 text-white/80">
                <p>Nenhum item do portfólio encontrado.</p>
                <p className="text-sm mt-2">Adicione itens através do dashboard.</p>
              </div>
            ) : (
              items.map((item) => (
                <Link key={item.id} href={`/portfolio#${item.id}`} className="block">
                  <div className="glass-effect rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:bg-white/12 shimmer-effect relative cursor-pointer h-80 sm:h-84 lg:h-96 xl:h-108 flex flex-col">
                    <div className="h-44 sm:h-48 xl:h-72 relative overflow-hidden flex-shrink-0 lg:h-60">
                      <Image
                        src={item.imagem_principal || "/placeholder.svg?height=300&width=400&query=portfolio item"}
                        alt={item.titulo}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-110"
                      />
                    </div>

                    <div className="p-3 sm:p-4 lg:p-5 pb-4 sm:pb-5 lg:pb-6 text-center flex-1 flex flex-col justify-between">
                      <div className="flex-1 flex flex-col justify-center space-y-2 sm:space-y-3">
                        <h3 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-white text-shadow">
                          {item.titulo}
                        </h3>
                        <p className="text-xs sm:text-sm lg:text-sm text-white leading-relaxed px-1 line-clamp-1 overflow-hidden text-ellipsis">
                          {item.descricao}
                        </p>
                      </div>
                      {/* --- INÍCIO DA CORREÇÃO --- */}
                      {/* Lógica de hover do botão 'PORTFOLIO COMPLETO' aplicada aqui */}
                      <span
                        className="inline-block px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 hover:-translate-y-1 border shimmer-effect relative overflow-hidden mt-2 sm:mt-3 border-transparent shadow-md"
                        style={{
                          backgroundColor: "rgba(57, 100, 150, 0.9)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          transition: "background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(76, 147, 227, 0.9)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(57, 100, 150, 0.9)"
                        }}
                      >
                        Ver Todos os Posts
                      </span>
                      {/* --- FIM DA CORREÇÃO --- */}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="text-center mt-8 sm:mt-10 lg:mt-12">
              <Link href="/portfolio">
                <button
                  className="inline-flex items-center gap-2 px-6 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/20 backdrop-blur-md py-2.5 text-xl rounded-full bg-slate-400"
                  style={{
                    backgroundColor: "rgba(57, 100, 150, 0.9)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    transition: "background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(76, 147, 227, 0.9)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(57, 100, 150, 0.9)"
                  }}
                >
                  Portfolio completo
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>

              {/* --- INÍCIO DA ALTERAÇÃO --- */}
              <div className="mt-4">
                <Link
                  href="/atendimento"
                  className="inline-flex items-center gap-2 hover:text-white transition-colors duration-300 text-sm group text-white"
                >
                  FALAR COM ESPECIALISTA
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
              {/* --- FIM DA ALTERAÇÃO --- */}
            </div>
          )}
        </>
      )}
    </section>
  )
}
