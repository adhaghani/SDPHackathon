import "server-only"

import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

import { getPublishableKey, getSupabaseUrl } from "@/lib/env"
import { createReferenceFetch } from "@/lib/supabase/reference-fetch"
import type { Database } from "@/types/database"

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  return createServerClient<Database>(getSupabaseUrl(), getPublishableKey(), {
    global: { fetch: createReferenceFetch(getSupabaseUrl()) },
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: false,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The Next.js proxy owns refresh-cookie writes during Server Rendering.
        }
      },
    },
  })
}
