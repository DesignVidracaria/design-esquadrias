"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageCircle, X, User, Headphones } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// ✅ PASSO 1: Defina suas credenciais do Supabase como constantes.
const supabaseUrl = "https://fqocipgxsyqepmoqwuoi.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb2NpcGd4c3lxZXBtb3F3dW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzYxMjIsImV4cCI6MjA3MDUxMjEyMn0.SSx7dCp-emJPoovqvXUQ-rRoykretc__qwXdTHQD3c8"

interface Message {
  id: string
  content: string
  sender_type: "cliente" | "arquiteto" | "atendente"
  sender_name: string
  created_at: string
  chat_id: string
}

interface ChatProps {
  isOpen: boolean
  onClose: ( ) => void
}

export default function Chat({ isOpen, onClose }: ChatProps) {
  const { user, userType } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // ✅ PASSO 2: Passe as credenciais diretamente para a função.
  // A função createClientComponentClient aceita um objeto com as chaves.
  const supabase = createClientComponentClient({
    supabaseUrl: supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen && user) {
      initializeChat()
    }
  }, [isOpen, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    if (!user || !userType) return

    try {
      const { data: existingChat, error: chatError } = await supabase
        .from("chats")
        .select("id")
        .eq("user_id", user.id)
        .eq("user_type", userType)
        .single()

      let currentChatId = existingChat?.id

      if (chatError && chatError.code !== 'PGRST116') {
        throw chatError;
      }

      if (!existingChat) {
        const { data: newChat, error: createError } = await supabase
          .from("chats")
          .insert({
            user_id: user.id,
            user_type: userType,
            user_name: user.nome || user.email,
            status: "ativo",
          })
          .select("id")
          .single()

        if (createError) throw createError
        currentChatId = newChat.id
      }

      if (currentChatId) {
        setChatId(currentChatId)
        loadMessages(currentChatId)
      }
    } catch (error) {
      console.error("Erro ao inicializar chat:", error)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user) return

    setLoading(true)
    try {
      const { error } = await supabase.from("mensagens").insert({
        chat_id: chatId,
        content: newMessage.trim(),
        sender_type: userType,
        sender_name: user.nome || user.email,
      })

      if (error) throw error

      setNewMessage("")
      loadMessages(chatId) 
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Chat com Atendente
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 pb-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Headphones className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem ainda.</p>
                  <p className="text-sm">Inicie uma conversa!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === userType ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.sender_type === userType ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender_type === "atendente" ? (
                          <Headphones className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        <span className="text-xs opacity-75">{message.sender_name}</span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !newMessage.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
