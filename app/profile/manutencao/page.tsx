"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Wrench, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ManutencaoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [formData, setFormData] = useState({
    tipo_servico: "",
    descricao_problema: "",
    urgencia: "",
    endereco: "",
    telefone_contato: "",
    data_preferencial: "",
    observacoes: "",
  })

  const supabase = createClientComponentClient()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImages((prev) => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Upload das imagens se houver
      const imageUrls: string[] = []
      if (images.length > 0) {
        for (const image of images) {
          const fileName = `manutencao/${Date.now()}-${image.name}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("arquivos")
            .upload(fileName, image)

          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from("arquivos").getPublicUrl(fileName)

          imageUrls.push(publicUrl)
        }
      }

      // Inserir solicitação de manutenção
      const { error } = await supabase.from("solicitacoes_manutencao").insert({
        cliente_id: user.id,
        tipo_servico: formData.tipo_servico,
        descricao_problema: formData.descricao_problema,
        urgencia: formData.urgencia,
        endereco: formData.endereco,
        telefone_contato: formData.telefone_contato,
        data_preferencial: formData.data_preferencial || null,
        observacoes: formData.observacoes,
        imagens: imageUrls,
        status: "pendente",
      })

      if (error) throw error

      alert("Solicitação de manutenção enviada com sucesso!")
      router.push("/profile")
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error)
      alert("Erro ao enviar solicitação. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Solicitação de Manutenção</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Descreva o problema</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
                  <Select
                    value={formData.tipo_servico}
                    onValueChange={(value) => handleInputChange("tipo_servico", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reparo_vidro">Reparo de Vidro</SelectItem>
                      <SelectItem value="troca_vidro">Troca de Vidro</SelectItem>
                      <SelectItem value="ajuste_esquadria">Ajuste de Esquadria</SelectItem>
                      <SelectItem value="vedacao">Vedação</SelectItem>
                      <SelectItem value="limpeza_especializada">Limpeza Especializada</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="urgencia">Urgência *</Label>
                  <Select
                    value={formData.urgencia}
                    onValueChange={(value) => handleInputChange("urgencia", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao_problema">Descrição do Problema *</Label>
                <Textarea
                  id="descricao_problema"
                  value={formData.descricao_problema}
                  onChange={(e) => handleInputChange("descricao_problema", e.target.value)}
                  placeholder="Descreva detalhadamente o problema..."
                  required
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange("endereco", e.target.value)}
                  placeholder="Endereço completo onde será realizado o serviço"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone_contato">Telefone de Contato *</Label>
                  <Input
                    id="telefone_contato"
                    value={formData.telefone_contato}
                    onChange={(e) => handleInputChange("telefone_contato", e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="data_preferencial">Data Preferencial</Label>
                  <Input
                    id="data_preferencial"
                    type="date"
                    value={formData.data_preferencial}
                    onChange={(e) => handleInputChange("data_preferencial", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  placeholder="Informações adicionais que possam ajudar..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Fotos do Problema</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Clique para adicionar fotos</p>
                    </div>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image) || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
