function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getSupabaseUrl(): string {
  return required(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  )
}

export function getPublishableKey(): string {
  return required(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  )
}

export function getSecretKey(): string {
  return required(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY")
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://127.0.0.1:3000"
  )
}

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true"
}

export function isFeatureEnabled(name: string): boolean {
  const value = process.env[`NEXT_PUBLIC_ENABLE_${name.toUpperCase()}`]
  if (value === "true") return true
  if (value === "false") return false
  // Demo mode intentionally exposes every implemented stretch feature so the
  // complete product can be audited without editing the local environment.
  return isDemoMode()
}

export function isRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_REALTIME === "true"
}
