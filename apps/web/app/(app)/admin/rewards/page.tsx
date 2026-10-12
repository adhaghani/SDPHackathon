import Link from "next/link"
import { redirect } from "next/navigation"

import { RedemptionVerificationForm } from "@/components/admin/admin-action-button"
import { ReversePointsForm } from "@/components/admin/admin-forms"
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
  const economyResult = await supabase.rpc("admin_rewards_economy", {
    p_township_id: active.townshipId,
    p_days: 90,
  })
  if (economyResult.error) throw new Error(economyResult.error.message)
  const candidatesResult = await supabase.rpc("admin_ledger_candidates", {
    p_township_id: active.townshipId,
    p_limit: 20,
  })
  if (candidatesResult.error) throw new Error(candidatesResult.error.message)
  const economy = (economyResult.data ?? {}) as Record<string, number>
  const candidates = (candidatesResult.data ?? []) as Array<{ ledger_id: string; user_id: string; action_type: string; delta: number; created_at: string; reason: string }>

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">Back to Township Pulse</Link>
      <h1 className="mt-5 font-display text-3xl font-bold">Rewards economy</h1>
      <p className="mt-2 text-muted-foreground">Verify voucher codes and review aggregate redemption activity.</p>
      <section className="mt-6 bb-card p-5">
        <h2 className="font-display text-lg font-bold">Mark a voucher used</h2>
        <div className="mt-4"><RedemptionVerificationForm /></div>
      </section>
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Points issued</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{economy.points_issued ?? 0}</p></div>
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Points redeemed</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{economy.points_redeemed ?? 0}</p></div>
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Redemption rate</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{Math.round(Number(economy.redemption_rate ?? 0) * 100)}%</p></div>
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Outstanding points</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{economy.points_outstanding ?? 0}</p></div>
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Manual check-in share</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{Math.round(Number(economy.manual_checkin_share ?? 0) * 100)}%</p></div>
        <div className="bb-card p-4"><p className="text-sm text-muted-foreground">Repeated pair loans</p><p className="mt-1 font-display text-2xl font-bold tabular-nums">{economy.repeated_pair_loans ?? 0}</p></div>
      </section>
      <section className="mt-6 bb-card p-5">
        <h2 className="font-display text-lg font-bold">Suspicious-activity review</h2>
        <p className="mt-1 text-sm text-muted-foreground">Raw ledger access for this review is audit-logged. Reversals create a negative reversal row, never edit history.</p>
        {candidates.length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {candidates.map((candidate) => (
              <li key={candidate.ledger_id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{candidate.action_type.replaceAll("_", " ")} · {candidate.delta > 0 ? "+" : ""}{candidate.delta} BP</p><p className="mt-1 text-sm text-muted-foreground">{candidate.reason} · {new Date(candidate.created_at).toLocaleString("en-MY")}</p></div><Badge variant="outline">{candidate.user_id.slice(0, 8)}</Badge></div>
                <div className="mt-3"><ReversePointsForm ledgerId={candidate.ledger_id} /></div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No candidates for review.</p>
        )}
      </section>
      <section className="mt-7">
        <h2 className="font-display text-lg font-bold">Recent redemptions</h2>
        {(redemptions.data ?? []).length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {redemptions.data?.map((redemption) => (
              <li key={redemption.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{redemption.rewards?.title}</p><p className="mt-1 text-sm text-muted-foreground">{redemption.cost_bp} BP · {new Date(redemption.created_at).toLocaleDateString("en-MY")}</p></div>
                <div className="flex items-center gap-3"><code className="rounded bg-muted px-2 py-1 text-sm font-bold tracking-widest">{redemption.code}</code><Badge variant={redemption.status === "issued" ? "secondary" : "outline"}>{redemption.status}</Badge></div>
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
