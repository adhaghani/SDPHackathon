"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type DemoActionState = {
  status: "idle" | "error"
  message?: string
}

const accounts = {
  resident: "aisyah@borrowbetter.demo",
  organiser: "raj@borrowbetter.demo",
  admin: "office@borrowbetter.demo",
} as const

export async function continueAsDemo(
  _state: DemoActionState,
  formData: FormData
): Promise<DemoActionState> {
  const role = formData.get("role")
  const email = role === "resident" || role === "organiser" || role === "admin" ? accounts[role] : null
  const password = process.env.DEMO_USER_PASSWORD

  if (!email || !password || process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return { status: "error", message: "Demo mode is not available." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { status: "error", message: "Demo sign-in is unavailable. Try again." }

  redirect(role === "admin" ? "/admin" : "/home")
}
