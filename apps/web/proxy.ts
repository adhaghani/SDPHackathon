import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getPublishableKey, getSupabaseUrl } from "@/lib/env"

const protectedPrefixes = [
  "/home",
  "/events",
  "/borrow",
  "/rewards",
  "/challenges",
  "/community",
  "/notifications",
  "/profile",
  "/onboarding",
  "/admin",
  "/guests",
  "/guard",
  "/sponsor",
  "/recycling",
  "/giveaway",
  "/help",
  "/ai",
]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getPublishableKey(),
    {
      auth: { flowType: "pkce" },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // The current render must receive the refreshed session as well as the browser.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const needsAuth = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  let redirectUrl: URL | undefined

  if (needsAuth && !user) {
    redirectUrl = new URL("/sign-in", request.url)
    redirectUrl.searchParams.set("next", pathname)
  } else if (user && (pathname === "/sign-in" || pathname === "/sign-up")) {
    redirectUrl = new URL("/home", request.url)
  }

  if (redirectUrl) {
    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    supabaseResponse = redirectResponse
  }

  supabaseResponse.headers.set("Cache-Control", "private, no-store")
  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)",
  ],
}
