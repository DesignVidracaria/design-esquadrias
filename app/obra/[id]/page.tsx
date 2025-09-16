"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Package, Calendar, CheckCircle, X, ImageIcon } from "lucide-react"
import { useParams } from "next/navigation"

export default function ObraDetailsPage() {
  const params = useParams()
  const [obra, setObra] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchObra = async () => {
      try {
        const { data, error } = await supabase.from("obras").select("*").eq("titulo", params.id).single()

        if (error) throw error
        setObra(data)
      } catch (error) {
        console.error("Erro ao buscar obra:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchObra()
    }
  }, [params.id])

  useEffect(() => {
    if (!obra?.id) return

    const subscription = supabase
      .channel(`obra-${obra.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "obras",
          filter: `id=eq.${obra.id}`,
        },
        (payload) => {
          console.log("[v0] Obra updated:", payload.new)
          setObra(payload.new)
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [obra?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary-blue-dark)] via-[var(--primary-blue-medium)] to-[var(--secondary-blue)] flex items-center justify-center">
        <div className="text-white text-xl">Carregando obra...</div>
      </div>
    )
  }

  if (!obra) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--primary-blue-dark)] via-[var(--primary-blue-medium)] to-[var(--secondary-blue)] flex items-center justify-center">
        <div className="text-white text-xl">Obra não encontrada</div>
      </div>
    )
  }

  const checklistStatus = obra.checklist_status || {}

  // Get dynamic questions from the database
  const dynamicQuestions = Object.entries(checklistStatus).map(([key, value]: [string, any]) => ({
    key,
    text: value?.text || key,
    status: value?.status || false,
  }))

  // Calculate progress based on actual checklist items
  const completedItems = dynamicQuestions.filter((item) => item.status === true).length
  const totalItems = dynamicQuestions.length
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-blue-dark)] via-[var(--primary-blue-medium)] to-[var(--secondary-blue)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">{obra.cliente}</h1>
          <p className="text-white/80 text-lg">Informações completas da obra #{obra.titulo}</p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Package size={24} />
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm mb-1">Número do Orçamento</label>
                <div className="text-white font-semibold">{obra.titulo}</div>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Cliente</label>
                <div className="text-white font-semibold">{obra.cliente}</div>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Instalador</label>
                <div className="text-white font-semibold">{obra.endereco}</div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar size={24} />
              Cronograma
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-white/70 text-sm mb-1">Data de Início</label>
                <div className="text-white font-semibold">
                  {obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString("pt-BR") : "Não definida"}
                </div>
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-1">Previsão de Término</label>
                <div className="text-white font-semibold">
                  {obra.data_previsao ? new Date(obra.data_previsao).toLocaleDateString("pt-BR") : "Não definida"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/70 text-sm">Progresso da Obra</span>
                <span className="text-white font-semibold text-sm">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className="text-white/60 text-xs mt-1">
                {completedItems} de {totalItems} itens concluídos
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="glass-effect rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={24} />
              Checklist da Obra
            </h2>
            <div className="space-y-3">
              {dynamicQuestions.length > 0 ? (
                dynamicQuestions.map((item, index) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <span className="text-white text-sm flex-1">{item.text}</span>
                    <div
                      className={`ml-4 px-3 py-1 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                        item.status ? "bg-green-500 text-white shadow-lg" : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {item.status ? <CheckCircle size={16} /> : <X size={16} />}
                      {item.status ? "CONCLUÍDO" : "PENDENTE"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-white/60 text-center py-4">Nenhum item no checklist ainda</div>
              )}
            </div>
          </div>

          {/* Observations */}
          {obra.observacoes && (
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Observações</h2>
              <div className="text-white/80 whitespace-pre-wrap">{obra.observacoes}</div>
            </div>
          )}

          {obra.galeria && obra.galeria.length > 0 && (
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon size={24} />
                Galeria de Imagens ({obra.galeria.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {obra.galeria.map((imagem: string, index: number) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group overflow-hidden rounded-lg"
                    onClick={() => setSelectedImage(imagem)}
                  >
                    <img
                      src={imagem || "/placeholder.svg"}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                          <ImageIcon size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Imagem ampliada"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
