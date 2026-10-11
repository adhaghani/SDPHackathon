import { BellIcon } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ResidentNav } from "@/components/navigation/resident-nav"
import { SignOutButton } from "@/components/navigation/sign-out-button"
import { getSessionContext } from "@/lib/data"
import { isDemoMode } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getSessionContext()

  if (!context.user) {
    redirect("/sign-in")
  }

  if (context.membership?.status !== "active") {
    redirect("/onboarding")
  }

  const supabase = await createClient()
  const unread = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.user.id)
    .is("read_at", null)

  return (
    <div className="min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {isDemoMode() ? (
        <div className="border-b border-line-impact/40 bg-line-impact/10 px-4 py-2 text-center text-sm font-medium text-rimba-ink">
          Demo data — fictional residents, events and rewards
        </div>
      ) : null}
      <div className="flex">
        <ResidentNav isAdmin={context.membership?.role === "township_admin"} />
        <div className="min-w-0 flex-1">
          <header className="flex min-h-16 items-center justify-between border-b border-border px-4 sm:px-6">
            <p className="font-heading font-semibold">Harmoni Heights</p>
            <div className="flex items-center gap-2">
              <Link href="/notifications" className="relative flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-muted" aria-label={`Notifications, ${unread.count ?? 0} unread`}>
                <BellIcon aria-hidden="true" className="size-5" />
                {unread.count ? <span className="rounded-full bg-line-borrow px-1.5 text-xs font-semibold text-white">{unread.count}</span> : null}
              </Link>
              <SignOutButton />
            </div>
          </header>
          <main
            id="main-content"
            className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6 lg:pb-10"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
