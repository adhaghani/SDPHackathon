import Link from "next/link"
import { redirect } from "next/navigation"

import { GuardConsole } from "@/components/guard/guard-console"
import { PillarStrip } from "@/components/block/pillar-strip"
import { SignOutButton } from "@/components/navigation/sign-out-button"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function GuardPage() {
  const active = await requireActiveMember()
  if (active.membership.role !== "guard") redirect("/home")

  const supabase = await createClient()
  await supabase.rpc("run_guest_pass_lazy_purge")
  const gatesResult = await supabase
    .from("gates")
    .select("id,name")
    .eq("township_id", active.townshipId)
    .eq("active", true)
    .order("name")
  if (gatesResult.error) throw new Error(gatesResult.error.message)
  const gates = gatesResult.data ?? []

  return (
    <div className="min-h-svh bg-lime px-4 pt-4 pb-28 text-ink sm:px-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/guard" className="min-w-0">
          <PillarStrip compact />
          <p className="mt-2 truncate text-sm font-semibold">Guard gate console</p>
        </Link>
        <SignOutButton className="bg-white/60 text-ink hover:bg-white" />
      </header>

      <main className="mx-auto mt-5 max-w-5xl">
        {gates.length ? (
          <GuardConsole gates={gates} townshipId={active.townshipId} />
        ) : (
          <section className="rounded-[24px] bg-white p-6">
            <h1 className="text-h1">No gates configured</h1>
            <p className="mt-3 text-body text-ink-soft">Ask a township admin to add a gate before opening the console.</p>
          </section>
        )}
      </main>
    </div>
  )
}
