"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface Cliente {
  id: string
  user_id: string
  nome: string
  email: string
  telefone?: string
  endereco?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

interface Arquiteto {
  id: string
  user_id: string
  nome: string
  email: string
  telefone?: string
  desconto_atual: number
  ativo: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  cliente: Cliente | null
  arquiteto: Arquiteto | null
  userType: "cliente" | "arquiteto" | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  cliente: null,
  arquiteto: null,
  userType: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [arquiteto, setArquiteto] = useState<Arquiteto | null>(null)
  const [userType, setUserType] = useState<"cliente" | "arquiteto" | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await fetchUserData(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.id === user?.id) return; // Evita reprocessamento se for o mesmo usuário
      if (session?.user) {
        setUser(session.user)
        await fetchUserData(session.user.id)
      } else {
        setUser(null)
        setCliente(null)
        setArquiteto(null)
        setUserType(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserData = async (userId: string, retries = 2) => {
    try {
      // Check if user is a cliente
      const { data: clienteData } = await supabase.from("clientes").select("*").eq("user_id", userId).single()

      if (clienteData) {
        setCliente(clienteData)
        setUserType("cliente")
        return
      }

      // Check if user is an arquiteto
      const { data: arquitetoData } = await supabase.from("arquitetos").select("*").eq("user_id", userId).single()

      if (arquitetoData) {
        setArquiteto(arquitetoData)
        setUserType("arquiteto")
        return
      }
    } catch (error) {
      if (retries > 0 && error instanceof Error) {
        console.warn(`Retry ${3 - retries} for user data fetch due to error: ${error.message}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await fetchUserData(userId, retries - 1);
      } else {
        console.error("Error fetching user data:", error)
      }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    cliente,
    arquiteto,
    userType,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
