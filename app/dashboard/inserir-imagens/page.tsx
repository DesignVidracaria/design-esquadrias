"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { X, ImageIcon, Save } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface HeroImage {
  id: string
  nome_arquivo: string
  url_imagem: string
  alt_text?: string
  ordem: number
  ativo: boolean
}

interface HeroButton {
  id: string
  titulo: string
  link: string
  ativo: boolean
}

export default function InserirImagensPage() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([])
  const [heroButton, setHeroButton] = useState<HeroButton | null>(null)
  const [buttonTitle, setButtonTitle] = useState("")
  const [buttonLink, setButtonLink] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const supabase = createClient()

  useEffect(() => {
    fetchHeroImages()
    fetchHeroButton()
  }, [])

  const fetchHeroImages = async () => {
    try {
      const { data, error } = await supabase.from("hero_images").select("*").eq("ativo", true).order("ordem")

      if (error) throw error
      setHeroImages(data || [])
    } catch (error) {
      console.error("Erro ao buscar imagens do hero:", error)
    }
  }

  const fetchHeroButton = async () => {
    try {
      const { data, error } = await supabase.from("hero_button").select("*").eq("ativo", true).single()

      if (error && error.code !== "PGRST116") throw error
      if (data) {
        setHeroButton(data)
        setButtonTitle(data.titulo)
        setButtonLink(data.link)
      }
    } catch (error) {
      console.error("Erro ao buscar botão do hero:", error)
    }
  }

  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (heroImages.length >= 5) {
      toast({
        title: "Erro",
        description: "Limite máximo de 5 imagens para o HeroSection",
        variant: "destructive",
      })
      return
    }

    const validFiles = Array.from(files).filter((file) => file.type.includes("image/"))

    if (validFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem (JPEG/PNG)",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      for (const file of validFiles) {
        if (heroImages.length >= 5) break

        // Upload para o Supabase Storage
        const fileName = `hero-${Date.now()}-${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage.from("media").upload(fileName, file)

        if (uploadError) throw uploadError

        // Obter URL pública
        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(fileName)

        // Salvar no banco de dados
        const { error: dbError } = await supabase.from("hero_images").insert({
          nome_arquivo: file.name,
          url_imagem: publicUrl,
          alt_text: `Design Vidraçaria - ${file.name}`,
          ordem: heroImages.length,
        })

        if (dbError) throw dbError
      }

      toast({
        title: "Sucesso",
        description: "Imagens do HeroSection adicionadas com sucesso!",
      })
      fetchHeroImages()
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast({
        title: "Erro",
        description: "Erro ao fazer upload das imagens",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteHeroImage = async (id: string, url: string) => {
    try {
      // Extrair nome do arquivo da URL
      const fileName = url.split("/").pop()

      // Deletar do storage
      if (fileName) {
        await supabase.storage.from("media").remove([fileName])
      }

      // Deletar do banco de dados
      const { error } = await supabase.from("hero_images").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Imagem removida com sucesso!",
      })
      fetchHeroImages()
    } catch (error) {
      console.error("Erro ao deletar imagem:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover imagem",
        variant: "destructive",
      })
    }
  }

  const saveHeroButton = async () => {
    if (!buttonTitle.trim() || !buttonLink.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título e o link do botão",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (heroButton) {
        // Update existing button
        const { error } = await supabase
          .from("hero_button")
          .update({ titulo: buttonTitle, link: buttonLink })
          .eq("id", heroButton.id)

        if (error) throw error
      } else {
        // Create new button
        const { error } = await supabase.from("hero_button").insert({ titulo: buttonTitle, link: buttonLink })

        if (error) throw error
      }

      toast({
        title: "Sucesso",
        description: "Botão do HeroSection atualizado com sucesso!",
      })
      fetchHeroButton()
    } catch (error) {
      console.error("Erro ao salvar botão:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar botão do HeroSection",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveAllChanges = async () => {
    try {
      await saveHeroButton()
      toast({
        title: "Alterações Salvas",
        description: "Todas as alterações foram salvas com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar as alterações",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-screen w-full">
      <div className="p-4 sm:p-6 lg:p-8 h-full my-2 lg:py-0">
        <div className="max-w-6xl mx-auto h-full">
          <div className="mt-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-left">Inserir Imagens no Site</h1>
          </div>

          <div className="space-y-6">
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">HeroSection</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="hero-images" className="block text-white/80 font-semibold mb-1">
                    Imagens do HeroSection
                  </label>
                  <div className="flex items-center space-x-2">
                    <label
                      htmlFor="hero-image-upload"
                      className="w-full flex items-center justify-center p-3 text-white/90 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 transition-colors"
                    >
                      <ImageIcon size={20} className="mr-2" />
                      <span>Selecione Imagens (JPEG/PNG) - {heroImages.length}/5</span>
                    </label>
                    <input
                      id="hero-image-upload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png"
                      onChange={handleHeroImageUpload}
                      className="hidden"
                      disabled={loading || heroImages.length >= 5}
                    />
                  </div>

                  {heroImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {heroImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="w-full h-32 relative rounded-lg overflow-hidden border border-white/20">
                            <Image
                              src={image.url_imagem || "/placeholder.svg"}
                              alt={image.alt_text || image.nome_arquivo}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            onClick={() => deleteHeroImage(image.id, image.url_imagem)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                          <p className="text-white/80 text-sm mt-2 truncate">{image.nome_arquivo}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Botão do HeroSection</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="button-title" className="block text-white/80 font-semibold mb-2">
                    Título do Botão
                  </label>
                  <Input
                    id="button-title"
                    type="text"
                    value={buttonTitle}
                    onChange={(e) => setButtonTitle(e.target.value)}
                    placeholder="Ex: Ver Portfólio"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label htmlFor="button-link" className="block text-white/80 font-semibold mb-2">
                    Link do Botão
                  </label>
                  <Input
                    id="button-link"
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="Ex: /portfolio ou https://exemplo.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-20">
              <Button
                onClick={saveAllChanges}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                <Save size={20} className="mr-2" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
