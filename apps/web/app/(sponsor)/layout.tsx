import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function SponsorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/sponsor/portal")

  return (
    <div className="min-h-svh bg-background">
      <header className="bb-band bb-safe-top rounded-none">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/sponsor/portal" className="font-display text-lg text-white">BorrowBetter sponsors</Link>
          <span className="rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink">Partner portal</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-0 pb-8 sm:px-6">{children}</main>
    </div>
  )
}
