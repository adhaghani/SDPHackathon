import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/navigation/sign-out-button"
import { createClient } from "@/lib/supabase/server"

export default async function SponsorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/sponsor/portal")

  return (
    <div className="min-h-svh bg-background">
      <header className="bb-safe-top sticky top-0 z-30 border-b border-hairline bg-surface">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/sponsor/portal" className="flex min-w-0 items-baseline gap-2">
            <span className="font-display text-lg font-extrabold text-ink">BorrowBetter</span>
            <span className="text-eyebrow truncate text-ink-muted">Partner portal</span>
          </Link>
          <SignOutButton compact className="text-ink" />
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
    </div>
  )
}
