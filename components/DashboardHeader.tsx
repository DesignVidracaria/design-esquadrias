"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, LogOut, User, Menu, Upload, Camera } from 'lucide-react'
import { supabase, type Profile } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  user: any
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export default function DashboardHeader({ user, sidebarCollapsed, onToggleSidebar }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nome: "",
    nickname: "",
    telefone: "",
    cargo: "",
    foto_perfil: "",
  })
  const router = useRouter()

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Tenta buscar o perfil na tabela 'profiles'
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, nome, email, telefone, cargo, tipo_usuario, ativo, foto_perfil, nickname")
          .eq("id", user.id)
          .single()

        if (profile && !profileError) {
          setUserProfile(profile)
          setProfileForm({
            nome: profile.nome || "",
            nickname: profile.nickname || profile.nome?.split(" ")[0] || profile.email?.split("@")[0] || "",
            telefone: profile.telefone || "",
            cargo: profile.cargo || "",
            foto_perfil: profile.foto_perfil || "",
          })
        } else if (profileError && profileError.code === "PGRST116") {
          // Se o perfil não existe na tabela 'profiles', verifica em 'clientes' e 'arquitetos'
          const { data: clienteData, error: clienteError } = await supabase
            .from("clientes")
            .select("id, nome, email")
            .eq("id", user.id)
            .single()

          if (clienteData && !clienteError) {
            setUserProfile({ ...clienteData, tipo_usuario: "cliente", ativo: true, foto_perfil: null, nickname: clienteData.nome.split(" ")[0] || "Cliente" })
            setProfileForm({
              nome: clienteData.nome || "",
              nickname: clienteData.nome.split(" ")[0] || "Cliente",
              telefone: clienteData.telefone || "",
              cargo: "Cliente",
              foto_perfil: null,
            })
          } else {
            const { data: arquitetoData, error: arquitetoError } = await supabase
              .from("arquitetos")
              .select("id, nome, email")
              .eq("id", user.id)
              .single()

            if (arquitetoData && !arquitetoError) {
              setUserProfile({ ...arquitetoData, tipo_usuario: "arquiteto", ativo: true, foto_perfil: null, nickname: arquitetoData.nome.split(" ")[0] || "Arquiteto" })
              setProfileForm({
                nome: arquitetoData.nome || "",
                nickname: arquitetoData.nome.split(" ")[0] || "Arquiteto",
                telefone: arquitetoData.telefone || "",
                cargo: "Arquiteto",
                foto_perfil: null,
              })
            } else {
              // Se não encontrou em nenhuma das tabelas, define como vendedor padrão
              const { data: newProfile, error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: user.id,
                  nome: user.user_metadata?.nome || user.email?.split("@")[0] || "Usuário",
                  email: user.email,
                  tipo_usuario: "vendedor",
                  ativo: true,
                })
                .select("id, nome, email, telefone, cargo, tipo_usuario, ativo, foto_perfil, nickname")
                .single()

              if (!insertError && newProfile) {
                setUserProfile(newProfile)
                setProfileForm({
                  nome: newProfile.nome || "",
                  nickname: newProfile.nickname || newProfile.nome?.split(" ")[0] || newProfile.email?.split("@")[0] || "",
                  telefone: newProfile.telefone || "",
                  cargo: newProfile.cargo || "",
                  foto_perfil: newProfile.foto_perfil || "",
                })
              }
            }
          }
        } else {
          console.error("Erro ao buscar perfil no header:", profileError)
        }
      } catch (error) {
        console.error("Erro geral ao buscar perfil no header:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      setProfileForm(prev => ({ ...prev, foto_perfil: publicUrl }))
      return publicUrl
    } catch (error) {
      console.error('Erro no upload da foto:', error)
      alert('Erro ao fazer upload da foto')
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/historico?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user?.id) return

    try {
      const updateData: any = {
        nome: profileForm.nome,
        telefone: profileForm.telefone,
        cargo: profileForm.cargo,
        nickname: profileForm.nickname,
        foto_perfil: profileForm.foto_perfil,
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)

      if (error) {
        console.error("Erro ao atualizar perfil:", error)
        alert("Erro ao atualizar perfil")
      } else {
        // Update local state
        setUserProfile((prev) =>
          prev
            ? {
                ...prev,
                nome: profileForm.nome,
                nickname: profileForm.nickname,
                telefone: profileForm.telefone,
                cargo: profileForm.cargo,
                foto_perfil: profileForm.foto_perfil,
              }
            : null,
        )
        setIsEditingProfile(false)
        alert("Perfil atualizado com sucesso!")
        
        // Forçar recarregamento da página para atualizar a sidebar
        window.location.reload()
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      alert("Erro ao atualizar perfil")
    }
  }

  const getDisplayName = () => {
    if (userProfile?.nickname) return userProfile.nickname
    if (userProfile?.nome) return userProfile.nome
    if (user?.email) return user.email.split("@")[0]
    return "Usuário"
  }

  const getUserType = () => {
    if (userProfile?.tipo_usuario === "administrador") return "Administrador"
    return "Vendedor"
  }

  return (
    <header
      className={`bg-[var(--primary-blue-dark)]/90 backdrop-blur-md border-b border-white/10 px-6 py-4 fixed top-0 right-0 z-50 transition-all duration-300 ${
        sidebarCollapsed ? "left-0" : "left-48 lg:left-48"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Mobile Sidebar Toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden text-white/70 hover:text-white hover:bg-white/10"
          >
            <Menu size={20} />
          </Button>
        </div>

        {/* CAIXA DE PESQUISA CENTRALIZADA */}
        <div className="flex-1 flex justify-center px-4">
          <form onSubmit={handleSearch} className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={20} />
              <Input
                type="text"
                placeholder="Buscar atendimentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white focus:border-[var(--secondary-blue)]"
              />
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-white hover:text-white hover:bg-white/10">
                {userProfile?.foto_perfil ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={userProfile.foto_perfil || "/placeholder.svg"}
                      alt="Foto do perfil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <User size={20} />
                )}
                <span className="hidden md:inline text-white font-medium">
                  {loading ? "Carregando..." : getDisplayName()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[var(--primary-blue-dark)] border-white/20 w-80">
              <DropdownMenuLabel className="text-white">
                <div>
                  <p className="font-medium text-white">{getDisplayName()}</p>
                  <p className="text-xs text-white/80">{getUserType()}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/20" />

              {/* Profile Edit Section */}
              <div className="p-4">
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-white text-xs font-medium">Nome Completo</label>
                      <Input
                        value={profileForm.nome}
                        onChange={(e) => setProfileForm({ ...profileForm, nome: e.target.value })}
                        className="mt-1 bg-white/10 border-white/20 text-white placeholder-white/60 text-sm"
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="text-white text-xs font-medium">Nickname</label>
                      <Input
                        value={profileForm.nickname}
                        onChange={(e) => setProfileForm({ ...profileForm, nickname: e.target.value })}
                        className="mt-1 bg-white/10 border-white/20 text-white placeholder-white/60 text-sm"
                        placeholder="Digite seu nickname"
                      />
                    </div>
                    <div>
                      <label className="text-white text-xs font-medium">Telefone</label>
                      <Input
                        value={profileForm.telefone}
                        onChange={(e) => setProfileForm({ ...profileForm, telefone: e.target.value })}
                        className="mt-1 bg-white/10 border-white/20 text-white placeholder-white/60 text-sm"
                        placeholder="Digite seu telefone"
                      />
                    </div>
                    <div>
                      <label className="text-white text-xs font-medium">Cargo</label>
                      <Input
                        value={profileForm.cargo}
                        onChange={(e) => setProfileForm({ ...profileForm, cargo: e.target.value })}
                        className="mt-1 bg-white/10 border-white/20 text-white placeholder-white/60 text-sm"
                        placeholder="Digite seu cargo"
                      />
                    </div>
                    <div>
                      <label className="text-white text-xs font-medium flex items-center gap-2">
                        <Camera size={14} />
                        Foto do Perfil
                      </label>
                      <div className="mt-1 space-y-2">
                        <Input
                          value={profileForm.foto_perfil}
                          onChange={(e) => setProfileForm({ ...profileForm, foto_perfil: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder-white/60 text-sm"
                          placeholder="Cole a URL da sua foto"
                        />
                        <div className="border-2 border-dashed border-white/20 rounded-lg p-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                await handlePhotoUpload(file)
                              }
                            }}
                            className="w-full text-white text-xs"
                            disabled={uploadingPhoto}
                          />
                          {uploadingPhoto && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              <span className="text-xs text-white">Enviando...</span>
                            </div>
                          )}
                        </div>
                        {profileForm.foto_perfil && (
                          <div className="mt-2">
                            <img
                              src={profileForm.foto_perfil || "/placeholder.svg"}
                              alt="Preview da foto"
                              className="w-16 h-16 rounded-full object-cover mx-auto"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdateProfile}
                        className="flex-1 bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue-medium)] text-white text-xs"
                      >
                        Salvar
                      </Button>
                      <Button
                        onClick={() => setIsEditingProfile(false)}
                        variant="outline"
                        className="flex-1 border-white/20 text-white hover:bg-white/10 text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Foto do perfil */}
                    <div className="flex justify-center mb-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                        {userProfile?.foto_perfil ? (
                          <img
                            src={userProfile.foto_perfil || "/placeholder.svg"}
                            alt="Foto do perfil"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={24} className="text-white/60" />
                        )}
                      </div>
                    </div>
                    <div className="text-white text-sm">
                      <strong className="text-white">Nome:</strong>
                      <span className="text-white ml-1">{userProfile?.nome || "Não informado"}</span>
                    </div>
                    <div className="text-white text-sm">
                      <strong className="text-white">Nickname:</strong>
                      <span className="text-white ml-1">{userProfile?.nickname || "Não informado"}</span>
                    </div>
                    <div className="text-white text-sm">
                      <strong className="text-white">Email:</strong>
                      <span className="text-white ml-1">{userProfile?.email || "Não informado"}</span>
                    </div>
                    <div className="text-white text-sm">
                      <strong className="text-white">Telefone:</strong>
                      <span className="text-white ml-1">{userProfile?.telefone || "Não informado"}</span>
                    </div>
                    <div className="text-white text-sm">
                      <strong className="text-white">Cargo:</strong>
                      <span className="text-white ml-1">{userProfile?.cargo || "Não informado"}</span>
                    </div>
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mt-3 bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue-medium)] text-white text-xs flex items-center gap-2"
                    >
                      <Upload size={14} />
                      Editar Perfil
                    </Button>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem className="text-red-400 hover:bg-red-500/20 cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
