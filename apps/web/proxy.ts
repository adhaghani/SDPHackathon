import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isJudgesPreview } from "@/lib/judges/config"

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
  "/superadmin",
  "/guests",
  "/guard",
  "/sponsor",
  "/recycling",
  "/giveaway",
  "/help",
  "/ai",
]

export async function proxy(request: NextRequest) {
  // The judges deployment never constructs a Supabase client or reaches live routes.
  if (isJudgesPreview()) {
    const { pathname } = request.nextUrl
    const isRead = request.method === "GET" || request.method === "HEAD"
    const isPreviewPage =
      pathname === "/" ||
      pathname === "/preview" ||
      pathname.startsWith("/preview/")
    const isImage = pathname.startsWith("/images/")
    const response =
      !isRead || pathname.startsWith("/api/")
        ? NextResponse.json(
            {
              error:
                "Judges preview is not connected to a database. Use borrowlah.my for the live app.",
            },
            { status: 403 }
          )
        : isPreviewPage || isImage
          ? NextResponse.next({ request })
          : NextResponse.redirect(new URL("/", request.url))
    response.headers.set("Cache-Control", "private, no-store")
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    return response
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getPublishableKey(), {
    auth: { flowType: "pkce" },
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // The current render must receive the refreshed session as well as the browser.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub

  const { pathname } = request.nextUrl
  const needsAuth = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  let redirectUrl: URL | undefined

  if (needsAuth && !userId) {
    redirectUrl = new URL("/sign-in", request.url)
    redirectUrl.searchParams.set("next", pathname)
  } else if (userId && (pathname === "/sign-in" || pathname === "/sign-up")) {
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
    "/((?!_next/static|_next/image|favicon.ico|icons/|brand/|demo/|sw[.]js$|manifest.webmanifest).*)",
  ],
}
