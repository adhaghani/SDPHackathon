import { redirect } from "next/navigation"

import { ResidentNav } from "@/components/navigation/resident-nav"
import { SignOutButton } from "@/components/navigation/sign-out-button"
import { isDemoMode } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

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
        <ResidentNav />
        <div className="min-w-0 flex-1">
          <header className="flex min-h-16 items-center justify-between border-b border-border px-4 sm:px-6">
            <p className="font-heading font-semibold">Harmoni Heights</p>
            <SignOutButton />
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
