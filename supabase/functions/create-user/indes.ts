import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar se o usuário está autenticado e é administrador
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase com service role para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar cliente Supabase normal para verificar o usuário atual
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verificar se o usuário atual é administrador
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se o usuário é administrador
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tipo_usuario')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.tipo_usuario !== 'administrador') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Administrator privileges required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter dados do corpo da requisição
    const { email, password, nome, telefone, endereco, cpf_cnpj, cidade, estado, userType, data_nascimento, cau, especialidade } = await req.json()

    if (!email || !password || !nome || !userType) {
      return new Response(
        JSON.stringify({ error: 'Email, password, nome and userType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar usuário usando service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automaticamente
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inserir na tabela profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        nome,
        email,
        tipo_usuario: userType,
        ativo: true
      })

    if (profileError) {
      // Se falhar, deletar o usuário criado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Preparar dados para tabela específica
    const tableData = {
      id: authData.user.id,
      nome,
      telefone,
      endereco,
      cpf_cnpj,
      cidade,
      estado,
    }

    // Inserir na tabela específica (clientes ou arquitetos)
    if (userType === 'cliente') {
      const clienteData = {
        ...tableData,
        data_nascimento,
      }

      const { error: clienteError } = await supabaseAdmin
        .from('clientes')
        .insert(clienteData)

      if (clienteError) {
        // Se falhar, deletar o usuário e profile criados
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id)
        return new Response(
          JSON.stringify({ error: `Failed to create client: ${clienteError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else if (userType === 'arquiteto') {
      const arquitetoData = {
        ...tableData,
        cau,
        especialidade,
      }

      const { error: arquitetoError } = await supabaseAdmin
        .from('arquitetos')
        .insert(arquitetoData)

      if (arquitetoError) {
        // Se falhar, deletar o usuário e profile criados
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id)
        return new Response(
          JSON.stringify({ error: `Failed to create architect: ${arquitetoError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${userType === 'cliente' ? 'Cliente' : 'Arquiteto'} criado com sucesso`,
        user_id: authData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
