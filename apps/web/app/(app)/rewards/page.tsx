import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { RedeemButton } from "@/components/rewards/redeem-button"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function RewardsPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [pointsResult, ledgerResult, badgesResult, levelsResult, rewardsResult, redemptionsResult] = await Promise.all([
    supabase
      .from("v_member_points")
      .select("balance,lifetime_points,last_activity_at")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId)
      .maybeSingle(),
    supabase
      .from("points_ledger")
      .select("id,delta,action_type,source_type,created_at,metadata")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("user_badges")
      .select("id,badge_id,earned_at,badges(slug,name,description,icon)")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId),
    supabase.from("levels").select("level,name,min_lifetime_points").order("level"),
    supabase
      .from("rewards")
      .select("id,title,description,kind,cost_bp,stock,valid_until,partners(name)")
      .eq("township_id", active.townshipId)
      .eq("active", true)
      .order("cost_bp"),
    supabase
      .from("redemptions")
      .select("id,code,status,cost_bp,created_at,rewards(title)")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false }),
  ])

  const lifetime = pointsResult.data?.lifetime_points ?? 0
  const levels = levelsResult.data ?? []
  const currentLevel = [...levels].reverse().find((level) => lifetime >= level.min_lifetime_points) ?? levels[0]
  const nextLevel = levels.find((level) => level.min_lifetime_points > lifetime)
  const progress = nextLevel
    ? Math.min(100, Math.round(((lifetime - (currentLevel?.min_lifetime_points ?? 0)) / (nextLevel.min_lifetime_points - (currentLevel?.min_lifetime_points ?? 0))) * 100))
    : 100
  const ledger = ledgerResult.data ?? []
  const earnedBadges = badgesResult.data ?? []
  const actionCounts = ledger.reduce<Record<string, number>>((counts, row) => {
    counts[row.action_type] = (counts[row.action_type] ?? 0) + 1
    return counts
  }, {})

  const badgeDefinitions = [
    { slug: "eco-warrior", name: "Eco Warrior", description: "Five verified sustainability activities.", target: 5, actionTypes: ["event_attendance"], sustainability: true },
    { slug: "good-neighbour", name: "Good Neighbour", description: "Ten completed lends or helps.", target: 10, actionTypes: ["item_lent_completed", "help_completed"] },
    { slug: "community-builder", name: "Community Builder", description: "Host three successful events.", target: 3, actionTypes: ["event_hosted"] },
    { slug: "community-champion", name: "Community Champion", description: "Sustained participation across activities.", target: 3, actionTypes: ["event_attendance", "item_lent_completed", "item_returned_on_time"] },
  ]

  return (
    <div className="flex flex-col gap-7">
      <PageBand
        eyebrow="Emas · BetterPoints"
        title="Your recognition route"
        description="Points come from verified real-world activity, never from opening the app."
      >
        <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-white">
            <p className="font-display text-5xl leading-none tabular-nums">{pointsResult.data?.balance ?? 0}</p>
            <p className="mt-2 text-sm text-band-eyebrow">BP available</p>
          </div>
          <div className="w-full max-w-sm">
            <div className="flex items-center justify-between gap-3 text-sm text-white">
              <span className="font-bold">{currentLevel?.name ?? "Newcomer"}</span>
              <span className="text-band-eyebrow">{nextLevel ? `${nextLevel.min_lifetime_points - lifetime} BP to ${nextLevel.name}` : "Top level reached"}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-sun transition-[width] duration-700" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-band-eyebrow">{lifetime.toLocaleString()} lifetime points</p>
          </div>
        </div>
      </PageBand>

      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">Badges</h2>
            <p className="mt-1 text-sm text-muted-foreground">Earned recognition and progress toward the next stop.</p>
          </div>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {badgeDefinitions.map((badge) => {
            const earned = earnedBadges.some((row) => row.badges?.slug === badge.slug)
            const current = badge.actionTypes.reduce((sum, action) => sum + (actionCounts[action] ?? 0), 0)
            const badgeProgress = Math.min(100, Math.round((current / badge.target) * 100))
            return (
              <li key={badge.slug} className="bb-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{badge.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
                  </div>
                  {earned ? <Badge variant="secondary" className="text-ink">Earned</Badge> : <Badge variant="outline">{current}/{badge.target}</Badge>}
                </div>
                {!earned ? (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-line-impact" style={{ width: `${badgeProgress}%` }} />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg">Recent activity</h2>
        {ledger.length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {ledger.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{describeActivity(row.action_type)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{new Date(row.created_at).toLocaleDateString("en-MY")}</p>
                </div>
                <span className={`font-display text-lg tabular-nums ${row.delta > 0 ? "text-ink" : "text-muted-foreground"}`}>
                  {row.delta > 0 ? "+" : ""}{row.delta} BP
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-4">
            <EmptyHeader>
              <EmptyTitle>No points yet</EmptyTitle>
              <EmptyDescription>Join an event or complete a borrow to start your route.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg">Reward catalogue</h2>
        <p className="mt-1 text-sm text-muted-foreground">Fictional partner vouchers and township perks.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {(rewardsResult.data ?? []).map((reward) => (
            <li key={reward.id} className="bb-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{reward.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{reward.description}</p>
                </div>
                <Badge variant="outline">{reward.partners?.name ?? reward.kind}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{reward.stock} left · valid until {reward.valid_until}</p>
              <div className="mt-4">
                <RedeemButton rewardId={reward.id} costBp={reward.cost_bp} />
              </div>
            </li>
          ))}
          {rewardsResult.data?.length === 0 ? <li className="bb-card p-5 text-sm text-muted-foreground sm:col-span-3">No rewards are available yet.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-lg">My vouchers</h2>
        {(redemptionsResult.data ?? []).length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {redemptionsResult.data?.map((redemption) => (
              <li key={redemption.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{redemption.rewards?.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{redemption.cost_bp} BP · {new Date(redemption.created_at).toLocaleDateString("en-MY")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <code className="rounded bg-muted px-2 py-1 text-sm font-bold tracking-widest">{redemption.code}</code>
                  <Badge variant={redemption.status === "issued" ? "secondary" : "outline"}>{redemption.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-4">
            <EmptyHeader><EmptyTitle>No vouchers yet</EmptyTitle><EmptyDescription>Redeem a catalogue reward when you have enough BetterPoints.</EmptyDescription></EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  )
}

function describeActivity(actionType: string): string {
  const labels: Record<string, string> = {
    event_attendance: "Joined a verified event",
    item_lent_completed: "Completed a neighbour lend",
    item_returned_on_time: "Returned a borrow on time",
    event_hosted: "Hosted a successful event",
    help_completed: "Completed a helping request",
  }
  return labels[actionType] ?? actionType.replaceAll("_", " ")
}
