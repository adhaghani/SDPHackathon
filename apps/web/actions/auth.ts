"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { getAppUrl } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import {
  magicLinkSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth"

export type AuthActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function safeNextPath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : ""
  return path.startsWith("/") && !path.startsWith("//") ? path : "/home"
}

function authErrorMessage(error: { message: string }): string {
  const message = error.message.toLowerCase()

  if (message.includes("invalid login credentials")) {
    return "Email or password is not correct."
  }

  if (message.includes("already registered")) {
    return "An account with this email already exists."
  }

  if (message.includes("rate limit")) {
    return "Too many attempts. Wait a moment and try again."
  }

  return "The request could not be completed. Check your details and try again."
}

export async function signIn(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { status: "error", message: authErrorMessage(error) }
  }

  redirect(safeNextPath(parsed.data.next ?? null))
}

export async function signUp(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    acceptedTerms: formData.get("acceptedTerms") === "on",
    acceptedPrivacy: formData.get("acceptedPrivacy") === "on",
    inviteCode: formData.get("inviteCode") || undefined,
  })

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    }
  }

  const supabase = await createClient()
  const acceptedAt = new Date().toISOString()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
      data: {
        display_name: parsed.data.displayName,
        terms_accepted_at: acceptedAt,
        privacy_accepted_at: acceptedAt,
        ...(parsed.data.inviteCode ? { invite_code: parsed.data.inviteCode } : {}),
      },
    },
  })

  if (error) {
    return { status: "error", message: authErrorMessage(error) }
  }

  if (data.session) {
    redirect("/onboarding")
  }

  redirect("/sign-in?message=Check+your+email+to+confirm+your+account.")
}

export async function requestMagicLink(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get("email") })

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Enter a valid email address.",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback`,
    },
  })

  if (error) {
    return { status: "error", message: authErrorMessage(error) }
  }

  return {
    status: "success",
    message: "Check your email for a secure sign-in link.",
  }
}

export async function signOut(): Promise<AuthActionState> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut({ scope: "local" })
  if (error) return { status: "error", message: "Could not sign out. Please try again." }
  const cookieStore = await cookies()
  cookieStore.delete("selected_township_id")
  revalidatePath("/", "layout")
  redirect("/sign-in")
}
