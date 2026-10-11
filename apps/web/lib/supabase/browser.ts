import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getPublishableKey, getSupabaseUrl } from "@/lib/env"
import type { Database } from "@/types/database"

let client: SupabaseClient<Database> | undefined

export function getBrowserClient(): SupabaseClient<Database> {
  client ??= createBrowserClient<Database>(
    getSupabaseUrl(),
    getPublishableKey(),
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )

  return client
}
