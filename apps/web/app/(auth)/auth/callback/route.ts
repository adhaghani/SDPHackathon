import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

const signInPath = "/sign-in?message=We+could+not+confirm+your+link.+Try+again."

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const tokenHash = url.searchParams.get("token_hash")
  const type = url.searchParams.get("type")
  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL(signInPath, request.url))
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    })
    if (error) {
      return NextResponse.redirect(new URL(signInPath, request.url))
    }
  } else {
    return NextResponse.redirect(new URL(signInPath, request.url))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const requestedNext = url.searchParams.get("next")
  const next =
    requestedNext === "/manager-invitation" || type === "invite"
      ? "/manager-invitation"
      : "/home"
  return NextResponse.redirect(new URL(user ? next : "/sign-in", request.url))
}
