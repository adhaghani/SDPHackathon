"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export type LocaleActionState = { status: "idle" | "success" }

export async function setPreferredLocale(
  _state: LocaleActionState,
  formData: FormData
): Promise<LocaleActionState> {
  const locale = formData.get("locale") === "ms" ? "ms" : "en"
  const cookieStore = await cookies()
  cookieStore.set("preferred_locale", locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
  redirect(formData.get("next")?.toString() || "/")
}
