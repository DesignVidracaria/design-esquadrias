"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"

export async function loginCliente(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/acesso?message=Erro ao fazer login: ${error.message}`)
  }

  revalidatePath("/", "layout")
  redirect("/profile")
}

export async function registerCliente(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const nome = formData.get("name") as string
  const userType = formData.get("userType") as "cliente" | "arquiteto"
  const telefone = formData.get("telefone") as string
  const cpf = formData.get("cpf") as string
  const cidade = formData.get("cidade") as string
  const estado = formData.get("estado") as string
  const endereco = formData.get("endereco") as string
  const registroProfissional = formData.get("registro_profissional") as string
  const especialidade = formData.get("especialidade") as string

  // Adiciona a validação de senha no servidor
  if (password !== confirmPassword) {
    redirect("/acesso?message=As senhas não coincidem.")
  }

  // Criar usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
      data: {
        nome,
        tipo_usuario: userType,
      },
    },
  })

  if (authError) {
    redirect(`/acesso?message=${authError.message}`)
  }

  if (authData.user) {
    if (userType === "cliente") {
      const { error: clienteError } = await supabase.from("clientes").upsert(
        {
          id: authData.user.id,
          nome,
          telefone,
          cpf_cnpj: cpf,
          cidade,
          estado,
          endereco,
        },
        {
          onConflict: "id",
        },
      )

      if (clienteError) {
        console.error("Erro ao criar cliente:", clienteError)
        redirect(`/acesso?message=Erro ao criar cliente: ${clienteError.message}`)
      }
    } else if (userType === "arquiteto") {
      const { error: arquitetoError } = await supabase.from("arquitetos").upsert(
        {
          id: authData.user.id,
          nome,
          telefone,
          cpf_cnpj: cpf,
          cidade,
          estado,
          endereco,
          cau: registroProfissional,
          especialidade,
          desconto_atual: 0,
        },
        {
          onConflict: "id",
        },
      )

      if (arquitetoError) {
        console.error("Erro ao criar arquiteto:", arquitetoError)
        redirect(`/acesso?message=Erro ao criar arquiteto: ${arquitetoError.message}`)
      }
    }
  } else {
    // Redireciona caso o usuário não seja criado mas não haja erro explícito
    redirect("/acesso?message=O registro falhou. Tente novamente.")
  }

  revalidatePath("/", "layout")
  redirect("/acesso?message=Conta criada! Verifique seu email para confirmar.")
}

export async function signOutCliente() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
