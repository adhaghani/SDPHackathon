import { redirect } from "next/navigation"

import { SponsorChallengeForm, SponsorRewardForm } from "@/components/sponsor/sponsor-forms"
import { isFeatureEnabled } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function SponsorPortalPage() {
  if (!isFeatureEnabled("sponsor_portal")) redirect("/home")
  const supabase = await createClient()
  const contextResult = await supabase.rpc("get_partner_context")
  if (contextResult.error || !contextResult.data) redirect("/home")
  const context = contextResult.data as { partner_id: string; partner_name: string; township_id: string }
  const [statsResult, rewardsResult, challengesResult] = await Promise.all([
    supabase.rpc("partner_stats", { p_partner_id: context.partner_id }),
    supabase.from("rewards").select("id,title,cost_bp,stock,active").eq("partner_id", context.partner_id).order("created_at", { ascending: false }),
    supabase.from("challenges").select("id,title,target,status,ends_at").eq("partner_id", context.partner_id).order("ends_at"),
  ])
  if (statsResult.error) throw new Error(statsResult.error.message)
  const stats = statsResult.data as Record<string, number | string>

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm font-medium text-line-impact">Sponsor portal</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">{context.partner_name}</h1>
        <p className="mt-2 text-muted-foreground">Create sponsor-funded rewards and challenges. Aggregate stats only; no resident-level activity is exposed.</p>
      </div>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Active rewards</p><p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{stats.active_rewards ?? 0}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Redemptions</p><p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{stats.redemptions ?? 0}</p></div>
        <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm text-muted-foreground">Challenges</p><p className="mt-1 font-heading text-2xl font-semibold tabular-nums">{stats.challenges ?? 0}</p></div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-lg font-semibold">Create a reward</h2><div className="mt-4"><SponsorRewardForm /></div></div>
        <div className="rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-lg font-semibold">Create a challenge</h2><div className="mt-4"><SponsorChallengeForm /></div></div>
      </section>
      <section>
        <h2 className="font-heading text-lg font-semibold">Your rewards</h2>
        {(rewardsResult.data ?? []).length ? <ul className="mt-4 divide-y divide-border border-y border-border">{rewardsResult.data?.map((reward) => <li key={reward.id} className="flex items-center justify-between gap-3 py-4"><span className="font-medium">{reward.title}</span><span className="text-sm text-muted-foreground">{reward.cost_bp} BP · {reward.stock} left</span></li>)}</ul> : <Empty className="mt-4"><EmptyHeader><EmptyTitle>No rewards yet</EmptyTitle><EmptyDescription>Create a sponsor-funded reward above.</EmptyDescription></EmptyHeader></Empty>}
      </section>
      <section>
        <h2 className="font-heading text-lg font-semibold">Your challenges</h2>
        {(challengesResult.data ?? []).length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {challengesResult.data?.map((challenge) => (
              <li key={challenge.id} className="flex items-center justify-between gap-3 py-4">
                <span className="font-medium">{challenge.title}</span>
                <span className="text-sm text-muted-foreground">{challenge.target} target · ends {new Date(challenge.ends_at).toLocaleDateString("en-MY")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-4">
            <EmptyHeader>
              <EmptyTitle>No challenges yet</EmptyTitle>
              <EmptyDescription>Create a sponsor challenge above.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  )
}
