import { cookies } from "next/headers"
import type { Locale } from "@/lib/i18n-copy"

export const locales: Locale[] = ["en", "ms"]

export async function getPreferredLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  return cookieStore.get("preferred_locale")?.value === "ms" ? "ms" : "en"
}

