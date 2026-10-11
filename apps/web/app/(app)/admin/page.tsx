import Link from "next/link"
import { redirect } from "next/navigation"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")

  const params = await searchParams
  const days = Math.min(90, Math.max(7, Number(params.days ?? 90) || 90))
  const supabase = await createClient()
  const pulseResult = await supabase.rpc("township_pulse", {
    p_township_id: active.townshipId,
    p_days: days,
  })
  if (pulseResult.error) throw new Error(pulseResult.error.message)
  const pulse = (pulseResult.data ?? {}) as Pulse
  const metrics = pulse.metrics ?? {}
  const maxWeekly = Math.max(1, ...(pulse.weekly_active_residents ?? []).map((row) => row.active_residents))
  const maxAttendance = Math.max(1, ...(pulse.attendance_by_category ?? []).map((row) => row.count))
  const maxMix = Math.max(1, ...(pulse.activity_mix ?? []).map((row) => row.count))

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-line-impact">Rimba · Township Pulse</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">Observed activity</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Aggregate signals for planning. Residents&apos; private activity is not exposed here.
          </p>
        </div>
        <form method="get" action="/admin" className="flex items-center gap-2">
          <label htmlFor="days" className="sr-only">Period</label>
          <select id="days" name="days" defaultValue={String(days)} className="h-11 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </select>
          <Button type="submit" className="h-11">Apply</Button>
        </form>
      </section>

      <nav aria-label="Admin tools" className="flex flex-wrap gap-2">
        <Button render={<Link href="/admin/insights" />} variant="outline" className="h-11">Insights</Button>
        <Button render={<Link href="/admin/budget" />} variant="outline" className="h-11">Budget</Button>
        <Button render={<Link href="/admin/members" />} variant="outline" className="h-11">Members</Button>
        <Button render={<Link href="/admin/rewards" />} variant="outline" className="h-11">Rewards economy</Button>
        <Button render={<Link href="/admin/moderation" />} variant="outline" className="h-11">Moderation</Button>
        <Button render={<Link href="/admin/methodology" />} variant="ghost" className="h-11">Methodology</Button>
        <Button render={<Link href="/admin/export" />} variant="ghost" className="h-11">Export CSV</Button>
      </nav>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Active residents" value={metrics.active_residents ?? 0} />
        <MetricTile label="Repeat event attendance" value={metrics.repeat_event_attendance ?? 0} suffix="residents" />
        <MetricTile label="Completed borrows" value={metrics.completed_borrowing_transactions ?? 0} />
        <MetricTile label="Items reused" value={metrics.items_reused ?? 0} suffix={`${metrics.reuse_count ?? 0} loans`} />
        <MetricTile label="Volunteer hours" value={metrics.verified_volunteer_hours ?? 0} suffix="verified" />
        <MetricTile label="Estimated purchases avoided" value={`RM ${Number(metrics.estimated_purchases_avoided_rm ?? 0).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`} note="estimated" />
        <MetricTile label="Points issued" value={metrics.points_issued ?? 0} />
        <MetricTile label="Points redeemed" value={metrics.points_redeemed ?? 0} />
      </section>

      <Tabs defaultValue="pulse">
        <TabsList>
          <TabsTrigger value="pulse">Pulse</TabsTrigger>
          <TabsTrigger value="mix">Activity mix</TabsTrigger>
          <TabsTrigger value="borrowing">Borrowing trend</TabsTrigger>
        </TabsList>
        <TabsContent value="pulse">
          <ChartPanel title="Weekly active residents" description="Residents with a verified meaningful action in each week.">
            <ul className="flex h-48 items-end gap-3">
              {(pulse.weekly_active_residents ?? []).map((row) => (
                <li key={row.week} className="flex min-w-8 flex-1 flex-col items-center gap-2">
                  <span className="text-xs tabular-nums">{row.active_residents}</span>
                  <div className="w-full rounded-t bg-line-impact" style={{ height: `${Math.max(4, (row.active_residents / maxWeekly) * 140)}px` }} />
                  <span className="text-[10px] text-muted-foreground">{row.week.slice(5)}</span>
                </li>
              ))}
              {!pulse.weekly_active_residents?.length ? <li className="text-sm text-muted-foreground">No weekly activity yet.</li> : null}
            </ul>
          </ChartPanel>
        </TabsContent>
        <TabsContent value="mix">
          <ChartPanel title="Verified attendance by category" description="Check-ins during the selected period.">
            <ul className="flex flex-col gap-3">
              {(pulse.attendance_by_category ?? []).map((row) => (
                <li key={row.category} className="grid gap-1">
                  <div className="flex justify-between text-sm"><span>{row.category}</span><span className="tabular-nums">{row.count}</span></div>
                  <div className="h-3 rounded bg-muted"><div className="h-3 rounded bg-line-event" style={{ width: `${(row.count / maxAttendance) * 100}%` }} /></div>
                </li>
              ))}
              {!pulse.attendance_by_category?.length ? <li className="text-sm text-muted-foreground">No verified attendance yet.</li> : null}
            </ul>
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="font-heading text-base font-semibold">Activity mix</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {(pulse.activity_mix ?? []).map((row) => (
                  <li key={row.action_type} className="flex items-center justify-between text-sm">
                    <span>{row.action_type.replaceAll("_", " ")}</span>
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-line-borrow" />{row.count}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Max mix scale: {maxMix}</p>
            </div>
          </ChartPanel>
        </TabsContent>
        <TabsContent value="borrowing">
          <ChartPanel title="Completed borrowing trend" description="Completed bookings by week.">
            <ul className="flex h-48 items-end gap-3">
              {(pulse.borrowing_trend ?? []).map((row) => (
                <li key={row.week} className="flex min-w-8 flex-1 flex-col items-center gap-2">
                  <span className="text-xs tabular-nums">{row.completed}</span>
                  <div className="w-full rounded-t bg-line-borrow" style={{ height: `${Math.max(4, row.completed * 24)}px` }} />
                  <span className="text-[10px] text-muted-foreground">{row.week.slice(5)}</span>
                </li>
              ))}
              {!pulse.borrowing_trend?.length ? <li className="text-sm text-muted-foreground">No completed borrows yet.</li> : null}
            </ul>
          </ChartPanel>
        </TabsContent>
      </Tabs>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold">Methodology note</h2>
            <p className="mt-1 text-sm text-muted-foreground">{pulse.suppression_rule ?? "Breakdowns with fewer than 5 residents are suppressed."}</p>
          </div>
          <Badge variant="outline">Aggregate only</Badge>
        </div>
      </section>
    </div>
  )
}

function MetricTile({
  label,
  value,
  suffix,
  note,
}: {
  label: string
  value: number | string
  suffix?: string
  note?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold tabular-nums">{value}</p>
      {suffix ? <p className="mt-1 text-xs text-muted-foreground">{suffix}</p> : null}
      {note ? <p className="mt-1 text-xs font-medium text-rimba-ink">{note}</p> : null}
    </div>
  )
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}
