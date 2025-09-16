"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, User, Lock, ArrowLeft, Loader2 } from "lucide-react"
import { login } from "./actions"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formDataObj = new FormData()
      formDataObj.append("email", formData.email)
      formDataObj.append("password", formData.password)

      await login(formDataObj)
    } catch (err) {
      console.error("Login error:", err)
      setError("Erro ao fazer login. Tente novamente.")
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative">
      {/* Back Button - MOVIDO PARA O TOPO ABSOLUTO */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Voltar ao Início</span>
          <span className="sm:hidden">Voltar</span>
        </Link>
      </div>

      {/* Login Card - PERFEITAMENTE CENTRALIZADO */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-effect rounded-2xl p-6 sm:p-8 shadow-2xl sm:px-8 sm:py-8">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-20 h-20 mx-auto mb-3 relative sm:mb-0 py-0 text-lg sm:h-40 sm:w-60">
              <Image src="/LOGO.png" alt="Design Vidraçaria" fill className="object-contain" />
            </div>

            <p className="text-sm sm:text-base text-white">Faça login para acessar o sistema</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field - FUNDO AZUL E TEXTO BRANCO COM AUTOFILL CUSTOMIZADO */}
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 z-10" size={18} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-[var(--primary-blue-dark)] border border-[var(--primary-blue-dark)] rounded-xl text-white placeholder-[#396496] focus:outline-none focus:ring-2 focus:ring-[#4c93e3] focus:border-[#4c93e3] transition-all duration-300 autofill:bg-[var(--primary-blue-dark)] autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] autofill:[-webkit-text-fill-color:white] [-webkit-autofill]:bg-[var(--primary-blue-dark)] [-webkit-autofill]:text-white [-webkit-autofill]:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] [-webkit-autofill]:[-webkit-text-fill-color:white] [-webkit-autofill:hover]:bg-[var(--primary-blue-dark)] [-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] [-webkit-autofill:focus]:bg-[var(--primary-blue-dark)] [-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] text-sm sm:text-base"
                  placeholder="Digite seu email"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field - FUNDO AZUL E TEXTO BRANCO - COM BOTÃO BRANCO DE VISUALIZAÇÃO E SEM ÍCONE NATIVO DO BROWSER */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 z-10" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-[var(--primary-blue-dark)] border border-[var(--primary-blue-dark)] rounded-xl text-white placeholder-[#396496] focus:outline-none focus:ring-2 focus:ring-[#4c93e3] focus:border-[#4c93e3] transition-all duration-300 [&::-ms-reveal]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-strong-password-auto-fill-button]:hidden autofill:bg-[var(--primary-blue-dark)] autofill:text-white autofill:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] autofill:[-webkit-text-fill-color:white] [-webkit-autofill]:bg-[var(--primary-blue-dark)] [-webkit-autofill]:text-white [-webkit-autofill]:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] [-webkit-autofill]:[-webkit-text-fill-color:white] [-webkit-autofill:hover]:bg-[var(--primary-blue-dark)] [-webkit-autofill:hover]:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] [-webkit-autofill:focus]:bg-[var(--primary-blue-dark)] [-webkit-autofill:focus]:shadow-[inset_0_0_0px_1000px_var(--primary-blue-dark)] text-sm sm:text-base"
                  placeholder="Digite sua senha"
                  required
                  disabled={isLoading}
                  style={{
                    WebkitTextSecurity: showPassword ? "none" : "disc",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-300 z-10"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[var(--secondary-blue)] to-[var(--primary-blue-medium)] text-white font-bold py-2.5 sm:py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 shimmer-effect relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        {/* Copyright */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-white/60 text-xs sm:text-sm">© 2025 Design Vidraçaria. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
