import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"

export default async function SponsorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/sponsor/portal")

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/sponsor/portal" className="font-heading text-lg font-semibold">BorrowBetter sponsors</Link>
          <Badge variant="outline">Partner portal</Badge>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  )
}
