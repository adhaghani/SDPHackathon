import { redirect } from "next/navigation"

import { SponsorChallengeForm, SponsorRewardForm } from "@/components/sponsor/sponsor-forms"
import { StatTile } from "@/components/admin/stat-tile"
import { PageBand } from "@/components/shared/page-band"
import { StatusPill } from "@/components/shared/status-pill"
import { isFeatureEnabled } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

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

  const rewards = rewardsResult.data ?? []
  const challenges = challengesResult.data ?? []

  return (
    <div className="flex flex-col gap-8">
      <PageBand
        className="mb-0"
        eyebrow="Sponsor portal"
        title={context.partner_name}
        description="Fund rewards and challenges for residents. You see aggregate figures only, never an individual resident's activity."
      />
      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Active rewards" value={String(stats.active_rewards ?? 0)} detail="In the resident catalogue" />
        <StatTile label="Redemptions" value={String(stats.redemptions ?? 0)} detail="Claims recorded" />
        <StatTile label="Challenges" value={String(stats.challenges ?? 0)} detail="Campaigns created" />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="rewards-heading" className="flex flex-col gap-4">
          <h2 id="rewards-heading" className="text-heading text-ink">Rewards</h2>
          {rewards.length ? (
            <ul className="bb-card divide-y divide-hairline">
              {rewards.map((reward) => (
                <li key={reward.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{reward.title}</p>
                    <p className="text-sm text-ink-muted tabular-nums">{reward.cost_bp.toLocaleString("en-MY")} BP · {reward.stock} left</p>
                  </div>
                  <StatusPill status={reward.active ? "active" : "paused"} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">No rewards yet. Create your first one below.</p>
          )}
          <div className="bb-card p-5">
            <h3 className="text-title text-ink">Create a reward</h3>
            <div className="mt-4"><SponsorRewardForm /></div>
          </div>
        </section>

        <section aria-labelledby="challenges-heading" className="flex flex-col gap-4">
          <h2 id="challenges-heading" className="text-heading text-ink">Challenges</h2>
          {challenges.length ? (
            <ul className="bb-card divide-y divide-hairline">
              {challenges.map((challenge) => (
                <li key={challenge.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{challenge.title}</p>
                    <p className="text-sm text-ink-muted tabular-nums">
                      Target {challenge.target.toLocaleString("en-MY")} · ends {new Date(challenge.ends_at).toLocaleDateString("en-MY")}
                    </p>
                  </div>
                  <StatusPill status={challenge.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">No challenges yet. Create one below.</p>
          )}
          <div className="bb-card p-5">
            <h3 className="text-title text-ink">Create a challenge</h3>
            <div className="mt-4"><SponsorChallengeForm /></div>
          </div>
        </section>
      </div>

      <p className="rounded-lg bg-ink p-4 text-sm text-surface">
        <strong>Privacy safeguard.</strong> Redemption counts are aggregated across the township. Names, units and messages are never shared with sponsors.
      </p>
    </div>
  )
}
