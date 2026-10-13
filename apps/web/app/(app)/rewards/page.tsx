import Link from "next/link"

import { ActivityRow } from "@/components/home/activity-row"
import { BadgeCard } from "@/components/rewards/badge-card"
import { RewardCard } from "@/components/rewards/reward-card"
import { VoucherCard } from "@/components/rewards/voucher-card"
import { StatusPill } from "@/components/shared/status-pill"
import { DemoLabel } from "@/components/shared/demo-label"
import { activityLine, describeActivity, formatRelativeDay, levelProgress } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { isDemoMode } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function RewardsPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [pointsResult, ledgerResult, statsResult, badgesResult, earnedBadgesResult, levelsResult, rewardsResult, redemptionsResult, valueResult, streakResult] = await Promise.all([
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
      .limit(3),
    supabase
      .from("points_ledger")
      .select("action_type")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId)
      .gt("delta", 0)
      .limit(1000),
    supabase
      .from("badges")
      .select("id,slug,name,description,icon,criteria"),
    supabase
      .from("user_badges")
      .select("id,badge_id,earned_at")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId),
    supabase.from("levels").select("level,name,min_lifetime_points").order("level"),
    supabase
      .from("rewards")
      .select("id,title,description,kind,cost_bp,stock,valid_until,image_path,partners(name)")
      .eq("township_id", active.townshipId)
      .eq("active", true)
      .order("cost_bp"),
    supabase
      .from("redemptions")
      .select("id,code,status,cost_bp,created_at,rewards(title,valid_until,partners(name))")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("estimated_value_saved_rm")
      .eq("borrower_id", active.user.id)
      .eq("township_id", active.townshipId)
      .eq("status", "completed"),
    supabase.rpc("compute_user_streak", { p_user_id: active.user.id }),
  ])
  if (valueResult.error) throw new Error(valueResult.error.message)
  if (streakResult.error) throw new Error(streakResult.error.message)
  const estimatedShared = (valueResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.estimated_value_saved_rm ?? 0),
    0
  )
  const streak = streakResult.data as {
    streak_months?: number
    current_month_active?: boolean
    at_risk?: boolean
    next_deadline?: string
  } | null

  const lifetime = pointsResult.data?.lifetime_points ?? 0
  const balance = pointsResult.data?.balance ?? 0
  const level = levelProgress(lifetime, levelsResult.data ?? [])
  const ledger = ledgerResult.data ?? []
  const badgeDefinitions = badgesResult.data ?? []
  const earnedBadgeIds = new Set((earnedBadgesResult.data ?? []).map((row) => row.badge_id))
  const actionCounts = (statsResult.data ?? []).reduce<Record<string, number>>((counts, row) => {
    counts[row.action_type] = (counts[row.action_type] ?? 0) + 1
    return counts
  }, {})
  const demo = isDemoMode()
  const redemptions = redemptionsResult.data ?? []
  const readyVouchers = redemptions.filter((row) => row.status === "issued")
  const pastVouchers = redemptions.filter((row) => row.status !== "issued")
  const stats = [
    { value: actionCounts.item_lent_completed ?? 0, label: "items lent" },
    { value: actionCounts.event_attendance ?? 0, label: "events joined" },
    { value: actionCounts.help_completed ?? 0, label: "neighbours helped" },
  ]

  return (
    <div className="flex flex-col gap-9">
      <section className="-mx-4 -mt-6 rounded-b-band bg-sun px-4 pt-7 pb-8 text-ink sm:-mx-6 sm:px-6 md:mx-0 md:mt-0 md:rounded-band md:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-eyebrow">Rimba · Your impact</p>
          {demo ? <DemoLabel className="border-ink" /> : null}
        </div>
        <h1 className="mt-4 flex flex-wrap items-baseline gap-x-3">
          <span className="font-display text-6xl leading-none font-extrabold tabular-nums sm:text-7xl">
            {balance.toLocaleString("en-MY")}
          </span>
          <span className="text-xl font-bold sm:text-2xl">BetterPoints</span>
        </h1>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-bold">
          <span>{level.current ? `Level ${level.current.level} · ${level.current.name}` : "Newcomer"}</span>
          <span className="tabular-nums">
            {level.next ? `${level.toNext.toLocaleString("en-MY")} BP to Level ${level.next.level}` : "Top level reached"}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progress to next level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={level.percent}
          className="mt-2 h-3 overflow-hidden rounded-full bg-surface"
        >
          <div className="h-full rounded-full bg-ink" style={{ width: `${level.percent}%` }} />
        </div>
        <ul className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 lg:max-w-2xl">
          {stats.map((stat) => (
            <li key={stat.label} className="min-w-0 rounded-lg bg-sun-tint p-3 sm:p-4">
              <p className="text-2xl font-bold tabular-nums">{stat.value.toLocaleString("en-MY")}</p>
              <p className="text-sm leading-tight">{stat.label}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <span className="tabular-nums">{lifetime.toLocaleString("en-MY")}</span> lifetime points, all from verified borrows, events and help.
        </p>
        <p className="mt-1 text-sm">
          Estimated value shared: <strong className="tabular-nums">RM {Math.round(estimatedShared).toLocaleString("en-MY")}</strong>{" "}
          across completed borrows · Estimated · <Link href="/admin/methodology" className="underline underline-offset-4">How we measure</Link>
        </p>
      </section>

      <div className="grid gap-9 lg:grid-cols-2 lg:gap-8">
        <section aria-labelledby="impact-report-heading" className="bb-card p-5">
          <h2 id="impact-report-heading" className="text-title text-ink">Your impact report</h2>
          <p className="mt-1 text-sm text-ink-muted">Download your personal verified activity and impact data.</p>
          <Button render={<a href="/api/profile/export" download />} variant="outline" className="mt-4">
            Download JSON export
          </Button>
          <Button render={<a href="/rewards/impact-report" download />} variant="ghost" className="mt-2">
            Download impact CSV
          </Button>
        </section>

        <section aria-labelledby="streak-heading" className="bb-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-eyebrow text-ink-muted">Sharing streak</p>
              <h2 id="streak-heading" className="text-title text-ink">
                <span className="tabular-nums">{streak?.streak_months ?? 0}</span> months
              </h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold text-ink ${streak?.at_risk ? "bg-coral-tint" : "bg-mint-tint"}`}>
              {streak?.at_risk ? "At risk" : streak?.current_month_active ? "Active" : "Start this month"}
            </span>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            {streak?.at_risk && streak.next_deadline
              ? `Borrow or lend by ${formatRelativeDay(streak.next_deadline)} to keep your ${streak.streak_months}-month streak.`
              : "A calendar month counts when you complete at least one lend or borrow."}
          </p>
        </section>

        <section aria-labelledby="badges-heading">
          <h2 id="badges-heading" className="text-heading text-ink">Badges</h2>
          {badgeDefinitions.length ? (
            <ul className="mt-4 grid grid-cols-4 gap-2.5 sm:gap-3">
              {badgeDefinitions.map((badge, index) => {
                const earned = earnedBadgeIds.has(badge.id)
                const criteria = badge.criteria as { threshold?: number; action_types?: string[] } | null
                const target = criteria?.threshold ?? 1
                const current = (criteria?.action_types ?? []).reduce((sum, action) => sum + (actionCounts[action] ?? 0), 0)
                return (
                  <BadgeCard
                    key={badge.id}
                    index={index}
                    name={badge.name}
                    description={badge.description}
                    icon={badge.icon}
                    earned={earned}
                    progress={earned ? undefined : Math.min(95, Math.round((current / target) * 100))}
                  />
                )
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">Your township hasn&apos;t set up badges yet.</p>
          )}
        </section>

        <section aria-labelledby="activity-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="activity-heading" className="text-heading text-ink">Latest activity</h2>
            <Link href="/rewards/activity" className="text-sm font-bold text-ink underline underline-offset-4">All activity</Link>
          </div>
          {ledger.length ? (
            <ul className="bb-card mt-4 divide-y divide-hairline">
              {ledger.map((row) => (
                <ActivityRow
                  key={row.id}
                  title={describeActivity(row.action_type)}
                  detail={`${activityLine(row.action_type)} · ${formatRelativeDay(row.created_at)}`}
                  delta={row.delta}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">
              No points yet. Join an event or complete a borrow to start your route.
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="rewards-heading">
        <h2 id="rewards-heading" className="text-heading text-ink">Rewards</h2>
        <p className="mt-1 text-sm text-ink-muted">Partner vouchers and township perks, funded by sponsors.</p>
        {(rewardsResult.data ?? []).length ? (
          <ul className="mt-4 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {(rewardsResult.data ?? []).map((reward) => (
              <RewardCard
                key={reward.id}
                id={reward.id}
                title={reward.title}
                partnerName={reward.partners?.name}
                kind={reward.kind}
                costBp={reward.cost_bp}
                imagePath={reward.image_path}
                stock={reward.stock}
                balance={balance}
                isDemo={demo}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">
            No rewards are available yet. Sponsors add them through the township office.
          </p>
        )}
      </section>

      <section aria-labelledby="vouchers-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="vouchers-heading" className="text-heading text-ink">My vouchers</h2>
          <p className="text-sm text-ink-muted">Show the code to the partner, or read it out. Each code works once.</p>
        </div>
        {readyVouchers.length ? (
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {readyVouchers.map((redemption) => (
              <VoucherCard
                key={redemption.id}
                title={redemption.rewards?.title ?? "Reward"}
                partnerName={redemption.rewards?.partners?.name}
                code={redemption.code}
                costBp={redemption.cost_bp}
                redeemedAt={redemption.created_at}
                validUntil={redemption.rewards?.valid_until}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">
            No vouchers ready to use. Redeem a reward above when you have enough BetterPoints.
          </p>
        )}
        {pastVouchers.length ? (
          <details className="group mt-6">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-bold text-ink">
              Used and expired
              <span className="rounded-full bg-ground px-2 text-sm tabular-nums">{pastVouchers.length}</span>
              <span className="text-sm text-ink-muted group-open:hidden">Show</span>
              <span className="hidden text-sm text-ink-muted group-open:inline">Hide</span>
            </summary>
            <ul className="bb-card mt-2 divide-y divide-hairline">
              {pastVouchers.map((redemption) => (
                <li key={redemption.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{redemption.rewards?.title}</p>
                    <p className="text-sm text-ink-muted tabular-nums">
                      {redemption.rewards?.partners?.name ?? "Township"} · {formatRelativeDay(redemption.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-sm text-ink-muted line-through">{redemption.code}</code>
                    <StatusPill status={redemption.status} />
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>
    </div>
  )
}
