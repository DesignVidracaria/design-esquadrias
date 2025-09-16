import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = "https://fqocipgxsyqepmoqwuoi.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb2NpcGd4c3lxZXBtb3F3dW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzYxMjIsImV4cCI6MjA3MDUxMjEyMn0.SSx7dCp-emJPoovqvXUQ-rRoykretc__qwXdTHQD3c8"

let supabaseInstance: any = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
})()

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Tipos TypeScript para type safety
export interface Cliente {
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

export interface Arquiteto {
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

export interface Atendimento {
  id: string
  nome: string
  telefone: string
  data_atendimento: string
  cidade: string
  endereco: string
  vendedor: string
  ja_cliente: boolean
  observacoes?: string
  status: "pendente" | "em_andamento" | "concluido" | "cancelado"
  user_id?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  nome?: string
  email?: string
  telefone?: string
  cargo?: string
  nickname?: string // Campo opcional para compatibilidade
  tipo_usuario: "administrador" | "vendedor"
  ativo: boolean
  foto_perfil?: string // Campo opcional para foto do perfil
  created_at: string
  updated_at: string
}

export interface AtendimentoStats {
  total_atendimentos: number
  pendentes: number
  em_andamento: number
  concluidos: number
  cancelados: number
  hoje: number
  esta_semana: number
  este_mes: number
}

export interface ConfiguracaoSistema {
  id: string
  chave: string
  valor: string
  descricao?: string
  created_at: string
  updated_at: string
}
