import Link from "next/link"

import { BlockGoalCard } from "@/components/block/block-goal-card"
import { ProgressRing } from "@/components/block/progress-ring"
import { StatTile } from "@/components/block/stat-tile"
import { ActivityRow } from "@/components/home/activity-row"
import type { BadgeCriteria, BadgeProgress } from "@/lib/badges"
import { BadgeCard } from "@/components/rewards/badge-card"
import { RewardCard } from "@/components/rewards/reward-card"
import { VoucherCard } from "@/components/rewards/voucher-card"
import { StatusPill } from "@/components/shared/status-pill"
import {
  activityLine,
  describeActivity,
  formatRelativeDay,
  levelProgress,
} from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { isDemoMode } from "@/lib/env"
import { formatEventDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@workspace/ui/components/button"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

export default async function RewardsPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    pointsResult,
    ledgerResult,
    statsResult,
    badgesResult,
    earnedBadgesResult,
    badgeProgressResult,
    levelsResult,
    rewardsResult,
    redemptionsResult,
    valueResult,
    streakResult,
    blockTotalResult,
    blockMineResult,
  ] = await Promise.all([
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
    supabase.from("badges").select("id,slug,name,description,icon,criteria"),
    supabase
      .from("user_badges")
      .select("id,badge_id,earned_at,criteria_snapshot")
      .eq("user_id", active.user.id)
      .eq("township_id", active.townshipId),
    supabase.rpc("get_my_badge_progress", { p_township_id: active.townshipId }),
    supabase
      .from("levels")
      .select("level,name,min_lifetime_points")
      .order("level"),
    supabase
      .from("rewards")
      .select(
        "id,title,description,kind,cost_bp,stock,valid_until,image_path,partners(name)"
      )
      .eq("township_id", active.townshipId)
      .eq("active", true)
      .order("cost_bp"),
    supabase
      .from("redemptions")
      .select(
        "id,code,status,cost_bp,created_at,rewards(title,valid_until,partners(name))"
      )
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
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("township_id", active.townshipId)
      .eq("status", "completed")
      .gte("updated_at", monthStart),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("township_id", active.townshipId)
      .eq("status", "completed")
      .gte("updated_at", monthStart)
      .or(`borrower_id.eq.${active.user.id},lender_id.eq.${active.user.id}`),
  ])

  if (badgesResult.error) throw new Error(badgesResult.error.message)
  if (earnedBadgesResult.error)
    throw new Error(earnedBadgesResult.error.message)
  if (badgeProgressResult.error)
    throw new Error(badgeProgressResult.error.message)
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
  const earnedBadges = new Map(
    (earnedBadgesResult.data ?? []).map((badge) => [badge.badge_id, badge])
  )
  const badgeProgress = new Map(
    (
      (badgeProgressResult.data ?? []) as Array<{
        badge_id: string
        progress: BadgeProgress
      }>
    ).map((badge) => [badge.badge_id, badge.progress])
  )
  const actionCounts = (statsResult.data ?? []).reduce<Record<string, number>>(
    (counts, row) => {
      counts[row.action_type] = (counts[row.action_type] ?? 0) + 1
      return counts
    },
    {}
  )
  const demo = isDemoMode()
  const redemptions = redemptionsResult.data ?? []
  const readyVouchers = redemptions.filter((row) => row.status === "issued")
  const pastVouchers = redemptions.filter((row) => row.status !== "issued")
  const stats = [
    { value: actionCounts.item_lent_completed ?? 0, label: "things lent" },
    { value: actionCounts.event_attendance ?? 0, label: "events joined" },
    { value: actionCounts.help_completed ?? 0, label: "helping hands" },
  ]
  const blockCurrent = blockTotalResult.count ?? 0
  const blockMine = blockMineResult.count ?? 0
  const daysLeft = Math.max(0, monthEnd.getDate() - now.getDate())
  const blockName = "Your block"

  return (
    <div className="-mx-4 overflow-hidden rounded-none bg-lime text-ink sm:-mx-6 md:mx-0 md:rounded-[32px]">
      <section className="flex flex-col gap-3.5 px-5 pt-6 pb-7 sm:px-7 md:px-10 md:pt-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-h2">Your impact</h1>
          <Button render={<Link href="#vouchers-heading" />} variant="outline">
            My vouchers ({readyVouchers.length})
          </Button>
        </div>

        <div className="flex items-center gap-[18px]">
          <ProgressRing
            value={level.percent}
            level={level.current?.level ?? 1}
          />
          <div>
            <div className="text-number">{balance.toLocaleString("en-MY")}</div>
            <div className="text-[15px] font-semibold">BetterPoints</div>
            <div className="mt-1 text-sm">
              {level.next ? (
                <>
                  <span className="tabular-nums">
                    {level.toNext.toLocaleString("en-MY")}
                  </span>{" "}
                  more to <strong>{level.next.name}</strong>
                </>
              ) : (
                <strong>Top level reached</strong>
              )}
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-3 gap-2">
          {stats.map((stat) => (
            <li key={stat.label}>
              <StatTile
                value={stat.value.toLocaleString("en-MY")}
                label={stat.label}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="min-h-[520px] rounded-t-[32px] bg-white px-5 pt-6 pb-8 text-ink sm:px-7 md:px-10">
        <BlockGoalCard
          goalLabel="things borrowed instead of bought"
          target={400}
          current={blockCurrent}
          mine={blockMine}
          daysLeft={daysLeft}
          bonusBp={50}
        />
        <p className="mt-2 text-xs text-ink-soft">
          Aggregate monthly activity only. Target and bonus are illustrative
          demo figures; current counts come from completed bookings.
        </p>

        <section id="vouchers-heading" className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-h2">My vouchers</h2>
            <p className="text-sm text-ink-soft">
              Show the code to the partner. Each code works once.
            </p>
          </div>
          {readyVouchers.length ? (
            <ul className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
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
            <p className="mt-4 rounded-[18px] bg-paper p-4 text-sm text-ink-soft">
              No vouchers ready to use.
            </p>
          )}
          {pastVouchers.length ? (
            <details className="group mt-6">
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 font-bold">
                Used and expired
                <span className="rounded-full bg-paper px-2 text-sm tabular-nums">
                  {pastVouchers.length}
                </span>
              </summary>
              <ul className="mt-2 divide-y divide-hairline rounded-[20px] bg-paper">
                {pastVouchers.map((redemption) => (
                  <li
                    key={redemption.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold">{redemption.rewards?.title}</p>
                      <p className="text-sm text-ink-soft tabular-nums">
                        {redemption.rewards?.partners?.name ?? "Township"} ·{" "}
                        {formatRelativeDay(redemption.created_at)}
                      </p>
                    </div>
                    <StatusPill status={redemption.status} />
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <section className="mt-[22px]">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[22px] leading-[26px] font-extrabold">
              Treat yourself
            </h2>
            <Link
              href="#vouchers-heading"
              className="text-sm font-semibold underline underline-offset-4"
            >
              My vouchers ({readyVouchers.length})
            </Link>
          </div>
          {(rewardsResult.data ?? []).length ? (
            <ScrollArea
              orientation="horizontal"
              className="mt-3 -mr-5 h-[184px] pr-5"
            >
              <ul className="flex h-[184px] w-max gap-3">
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
                  />
                ))}
              </ul>
            </ScrollArea>
          ) : (
            <p className="mt-4 rounded-[18px] bg-paper p-4 text-sm text-ink-soft">
              No rewards are available yet.
            </p>
          )}
        </section>

        <div className="mt-8 grid gap-[22px] lg:grid-cols-2">
          <section className="rounded-[20px] bg-paper p-5">
            <h2 className="text-h2">Your impact report</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Download your verified activity and impact data.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                render={<a href="/api/profile/export" download />}
                variant="outline"
              >
                Download JSON
              </Button>
              <Button
                render={<a href="/rewards/impact-report" download />}
                variant="ghost"
              >
                Impact CSV
              </Button>
            </div>
          </section>

          <section className="rounded-[20px] bg-sky p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold tracking-[0.08em] uppercase">
                  Sharing streak
                </p>
                <h2 className="mt-1 text-h2">
                  <span className="tabular-nums">
                    {streak?.streak_months ?? 0}
                  </span>{" "}
                  months
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-bold ${streak?.at_risk ? "bg-tomato" : "bg-lime"}`}
              >
                {streak?.at_risk
                  ? "At risk"
                  : streak?.current_month_active
                    ? "Active"
                    : "Start this month"}
              </span>
            </div>
            <p className="mt-3 text-sm">
              {streak?.at_risk && streak.next_deadline
                ? `Borrow or lend by ${formatEventDate(streak.next_deadline)} to keep your streak.`
                : "A calendar month counts when you complete at least one lend or borrow."}
            </p>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-h2">Badges</h2>
          {badgeDefinitions.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {badgeDefinitions.map((badge, index) => {
                const earned = earnedBadges.get(badge.id)
                return (
                  <BadgeCard
                    key={badge.id}
                    index={index}
                    name={badge.name}
                    description={badge.description}
                    icon={badge.icon}
                    earned={Boolean(earned)}
                    criteria={badge.criteria as BadgeCriteria}
                    earnedAt={earned?.earned_at}
                    earnedCriteria={
                      earned?.criteria_snapshot as BadgeCriteria | null
                    }
                    progress={badgeProgress.get(badge.id)}
                  />
                )
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">
              Your township hasn&apos;t set up badges yet.
            </p>
          )}
        </section>

        <section className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-h2">Latest activity</h2>
            <Link
              href="/rewards/activity"
              className="text-sm font-bold underline underline-offset-4"
            >
              All activity
            </Link>
          </div>
          {ledger.length ? (
            <ul className="mt-4 divide-y divide-hairline rounded-[20px] bg-paper">
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
            <p className="mt-4 rounded-[18px] bg-paper p-4 text-sm text-ink-soft">
              No points yet.
            </p>
          )}
        </section>

        <p className="mt-8 text-xs text-ink-soft">
          Goal figures are illustrative.
        </p>
      </section>
    </div>
  )
}
