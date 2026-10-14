import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

import { getPublishableKey, getSecretKey, getSupabaseUrl } from "@/lib/env"
import type { Database } from "@/types/database"

let adminClient: SupabaseClient<Database> | undefined

/**
 * Server-only service client. Every use must be documented in
 * docs/ARCHITECTURE.md and limited to seeding, demo reset, cron jobs or authenticated self-account deletion.
 */
export function getAdminClient(): SupabaseClient<Database> {
  adminClient ??= createSupabaseClient<Database>(
    getSupabaseUrl(),
    getSecretKey(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return adminClient
}
