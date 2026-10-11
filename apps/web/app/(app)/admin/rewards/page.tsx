import Link from "next/link"
import { redirect } from "next/navigation"

import { RedemptionVerificationForm } from "@/components/admin/admin-action-button"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function AdminRewardsPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const redemptions = await supabase
    .from("redemptions")
    .select("id,code,status,cost_bp,created_at,rewards(title)")
    .eq("township_id", active.townshipId)
    .order("created_at", { ascending: false })
    .limit(50)
  if (redemptions.error) throw new Error(redemptions.error.message)

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">Back to Township Pulse</Link>
      <h1 className="mt-5 font-heading text-3xl font-semibold">Rewards economy</h1>
      <p className="mt-2 text-muted-foreground">Verify voucher codes and review aggregate redemption activity.</p>
      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Mark a voucher used</h2>
        <div className="mt-4"><RedemptionVerificationForm /></div>
      </section>
      <section className="mt-7">
        <h2 className="font-heading text-lg font-semibold">Recent redemptions</h2>
        {(redemptions.data ?? []).length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {redemptions.data?.map((redemption) => (
              <li key={redemption.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{redemption.rewards?.title}</p><p className="mt-1 text-sm text-muted-foreground">{redemption.cost_bp} BP · {new Date(redemption.created_at).toLocaleDateString("en-MY")}</p></div>
                <div className="flex items-center gap-3"><code className="rounded bg-muted px-2 py-1 text-sm font-semibold tracking-widest">{redemption.code}</code><Badge variant={redemption.status === "issued" ? "secondary" : "outline"}>{redemption.status}</Badge></div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-4"><EmptyHeader><EmptyTitle>No redemptions yet</EmptyTitle><EmptyDescription>Resident redemptions will appear here.</EmptyDescription></EmptyHeader></Empty>
        )}
      </section>
    </div>
  )
}
