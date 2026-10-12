import Link from "next/link"
import { redirect } from "next/navigation"

import { StatTile } from "@/components/admin/stat-tile"
import { DemoLabel } from "@/components/shared/demo-label"
import { activityLine } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { isDemoMode, isFeatureEnabled } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type PulseMetrics = {
  active_residents?: number
  repeat_event_attendance?: number
  verified_volunteer_hours?: number
  completed_borrowing_transactions?: number
  items_reused?: number
  reuse_count?: number
  estimated_purchases_avoided_rm?: number
  points_issued?: number
  points_redeemed?: number
}

type Pulse = {
  period_days?: number
  metrics?: PulseMetrics
  weekly_active_residents?: Array<{ week: string; active_residents: number }>
  attendance_by_category?: Array<{ category: string; count: number }>
  activity_mix?: Array<{ action_type: string; count: number }>
  borrowing_trend?: Array<{ week: string; completed: number }>
  suppression_rule?: string
}

type Insights = {
  neighbourhood_participation?: Array<{ neighbourhood: string; residents: number }>
  suppression_rule?: string
}

const lines = [
  { name: "Pinjam", english: "borrow", bar: "bg-coral" },
  { name: "Jom", english: "events", bar: "bg-sun" },
  { name: "Tolong", english: "help", bar: "bg-mint" },
  { name: "Rimba", english: "impact", bar: "bg-lilac" },
] as const

const adminLinks = [
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/budget", label: "Budget" },
  { href: "/admin/rewards", label: "Rewards economy" },
  { href: "/admin/badges", label: "Awards" },
  { href: "/admin/hubs", label: "Hubs", flag: "equipment_hubs" },
  { href: "/admin/map", label: "Map", flag: "leaflet" },
  { href: "/admin/methodology", label: "Methodology" },
] as const

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")

  const params = await searchParams
  const days = Math.min(90, Math.max(7, Number(params.days ?? 30) || 30))
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const [pulseResult, insightsResult, disputesResult, reportsResult, eventsToCloseResult, rewardsLiveResult] = await Promise.all([
    supabase.rpc("township_pulse", { p_township_id: active.townshipId, p_days: days }),
    supabase.rpc("admin_insights", { p_township_id: active.townshipId, p_days: days }),
    supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("township_id", active.townshipId).eq("status", "open"),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("township_id", active.townshipId)
      .eq("status", "published")
      .lt("ends_at", nowIso),
    supabase
      .from("rewards")
      .select("id", { count: "exact", head: true })
      .eq("township_id", active.townshipId)
      .eq("active", true)
      .not("partner_id", "is", null),
  ])
  if (pulseResult.error) throw new Error(pulseResult.error.message)
  const pulse = (pulseResult.data ?? {}) as Pulse
  const insights = (insightsResult.data ?? {}) as Insights
  const metrics = pulse.metrics ?? {}

  const lineTotals = (pulse.activity_mix ?? []).reduce<Record<string, number>>((totals, row) => {
    const line = activityLine(row.action_type)
    totals[line] = (totals[line] ?? 0) + row.count
    return totals
  }, {})
  const maxLine = Math.max(1, ...lines.map((line) => lineTotals[line.name] ?? 0))
  const neighbourhoods = insights.neighbourhood_participation ?? []
  const maxNeighbourhood = Math.max(1, ...neighbourhoods.map((row) => row.residents))
  const weekly = pulse.weekly_active_residents ?? []
  const maxWeekly = Math.max(1, ...weekly.map((row) => row.active_residents))
  const attention = [
    { label: "Open disputes", count: disputesResult.count ?? 0, href: "/admin/disputes", tint: "bg-coral-tint" },
    { label: "Moderation queue", count: reportsResult.count ?? 0, href: "/admin/moderation", tint: "bg-ground" },
    { label: "Events awaiting completion", count: eventsToCloseResult.count ?? 0, href: "/events", tint: "bg-ground" },
  ]
  const fmt = (value: number | undefined) => Number(value ?? 0).toLocaleString("en-MY")
  const suppression = insights.suppression_rule ?? pulse.suppression_rule ?? "Breakdowns with fewer than 5 residents are suppressed."

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-eyebrow text-ink-muted">{active.membership.townships?.name ?? "Township"} · Aggregate view</p>
          <h1 className="text-display-lg mt-1 text-ink">Township Pulse</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isDemoMode() ? <DemoLabel /> : null}
          <form method="get" action="/admin" className="flex items-center gap-2">
            <label htmlFor="days" className="text-sm font-bold text-ink">Period</label>
            <select
              id="days"
              name="days"
              defaultValue={String(days)}
              className="h-11 rounded-lg border border-ink-muted bg-surface px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <Button type="submit" variant="outline">Apply</Button>
          </form>
        </div>
      </div>

      <nav aria-label="Admin tools" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:hidden">
        {adminLinks
          .filter((link) => !("flag" in link) || isFeatureEnabled(link.flag))
          .map((link) => (
            <Button key={link.href} render={<Link href={link.href} />} variant="outline" className="shrink-0">
              {link.label}
            </Button>
          ))}
      </nav>

      <section aria-label="Key figures" className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <StatTile label="Active residents" value={fmt(metrics.active_residents)} detail={`Verified action in ${days} days`} />
        <StatTile label="Completed loans" value={fmt(metrics.completed_borrowing_transactions)} detail="Two-sided confirmed" />
        <StatTile label="Verified volunteer hours" value={fmt(metrics.verified_volunteer_hours)} detail={`${fmt(metrics.repeat_event_attendance)} repeat attendees`} />
        <StatTile
          label="Purchases avoided"
          value={`RM ${Math.round(Number(metrics.estimated_purchases_avoided_rm ?? 0)).toLocaleString("en-MY")}`}
          estimated
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="lines-heading" className="bb-card p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="lines-heading" className="text-heading text-ink">Participation by township line</h2>
              <p className="text-sm text-ink-muted">Verified actions, last {days} days</p>
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              {lines.map((line) => {
                const value = lineTotals[line.name] ?? 0
                return (
                  <li key={line.name} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem] items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_3.5rem]">
                    <span className="truncate">
                      <span className="font-bold text-ink">{line.name}</span>{" "}
                      <span className="text-sm text-ink-muted">{line.english}</span>
                    </span>
                    <span aria-hidden="true" className="h-5 overflow-hidden rounded-md bg-ground">
                      <span className={cn("block h-full rounded-md", line.bar)} style={{ width: `${(value / maxLine) * 100}%` }} />
                    </span>
                    <span className="text-right font-bold text-ink tabular-nums">{fmt(value)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-xs text-ink-muted">{suppression}</p>

            <h3 className="text-title mt-8 text-ink">By neighbourhood</h3>
            {neighbourhoods.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[22rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-hairline text-ink-muted">
                      <th scope="col" className="py-2 pr-3 font-bold">Neighbourhood</th>
                      <th scope="col" className="py-2 pr-3 text-right font-bold">Active residents</th>
                      <th scope="col" className="py-2 font-bold">Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {neighbourhoods.map((row) => {
                      const share = row.residents / maxNeighbourhood
                      const signal = share >= 0.75 ? ["Most active", "bg-mint-tint"] : share >= 0.4 ? ["Steady", "bg-lilac-tint"] : ["Needs an event", "bg-coral-tint"]
                      return (
                        <tr key={row.neighbourhood}>
                          <th scope="row" className="py-2.5 pr-3 font-bold text-ink">{row.neighbourhood}</th>
                          <td className="py-2.5 pr-3 text-right tabular-nums">{fmt(row.residents)}</td>
                          <td className="py-2.5">
                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ink", signal[1])}>{signal[0]}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">No neighbourhood has enough participation to show yet without identifying residents.</p>
            )}
          </section>

          <section aria-labelledby="weekly-heading" className="bb-card p-5 sm:p-6">
            <h2 id="weekly-heading" className="text-title text-ink">Weekly active residents</h2>
            <p className="mt-1 text-sm text-ink-muted">Residents with at least one verified action each week.</p>
            {weekly.length ? (
              <ul className="mt-5 flex h-40 items-end gap-2 overflow-x-auto">
                {weekly.map((row) => (
                  <li key={row.week} className="flex min-w-8 flex-1 flex-col items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums">{row.active_residents}</span>
                    <span className="w-full rounded-t-md bg-lilac" style={{ height: `${Math.max(4, (row.active_residents / maxWeekly) * 100)}px` }} />
                    <span className="text-[11px] text-ink-muted tabular-nums">{row.week.slice(5)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">No weekly activity yet.</p>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section aria-labelledby="attention-heading" className="bb-card p-5">
            <h2 id="attention-heading" className="text-heading text-ink">Needs attention</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {attention.map((row) => (
                <li key={row.label}>
                  <Link
                    href={row.href}
                    className={cn("flex min-h-12 items-center justify-between gap-3 rounded-lg px-4 font-bold text-ink transition-shadow duration-150 ease-out hover:shadow-card", row.count > 0 ? row.tint : "bg-ground")}
                  >
                    {row.label}
                    <span className="tabular-nums">{row.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="privacy-heading" className="bb-band rounded-lg p-5">
            <h2 id="privacy-heading" className="text-eyebrow text-band-eyebrow">Privacy safeguard</h2>
            <p className="mt-2 text-surface">
              This view shows aggregates only. Private messages, unit labels and individual resident activity are never shown to admins or sponsors.
            </p>
            <Link href="/admin/methodology" className="mt-3 inline-block font-bold text-surface underline underline-offset-4">
              How we measure
            </Link>
          </section>

          <section aria-labelledby="economy-heading" className="bb-card p-5">
            <h2 id="economy-heading" className="text-heading text-ink">Rewards economy</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              {[
                ["BP issued", fmt(metrics.points_issued)],
                ["BP redeemed", fmt(metrics.points_redeemed)],
                ["Sponsor rewards live", fmt(rewardsLiveResult.count ?? 0)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="font-bold text-ink tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button render={<Link href="/ai" />} variant="outline" size="sm">AI summary</Button>
              <Button render={<Link href="/admin/export" />} variant="ghost" size="sm">Export CSV</Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
