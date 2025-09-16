import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

const supabaseUrl = "https://fqocipgxsyqepmoqwuoi.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxb2NpcGd4c3lxZXBtb3F3dW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzYxMjIsImV4cCI6MjA3MDUxMjEyMn0.SSx7dCp-emJPoovqvXUQ-rRoykretc__qwXdTHQD3c8"

export const createClient = cache(async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
})
