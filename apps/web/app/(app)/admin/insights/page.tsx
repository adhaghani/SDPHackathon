import Link from "next/link"
import { redirect } from "next/navigation"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

type InsightPayload = {
  attendance_grid?: Array<{ weekday: string; slot: string; count: number }>
  repeat_cohorts?: Array<{ label: string; residents: number }>
  neighbourhood_participation?: Array<{ neighbourhood: string; residents: number }>
  facility_utilisation?: Array<{ facility: string; event_hours: number; available_hours: number; underused: boolean }>
  suggestions?: string[]
  suppression_rule?: string
}

export default async function AdminInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const params = await searchParams
  const days = Math.min(90, Math.max(7, Number(params.days ?? 30) || 30))
  const supabase = await createClient()
  const result = await supabase.rpc("admin_insights", {
    p_township_id: active.townshipId,
    p_days: days,
  })
  if (result.error) throw new Error(result.error.message)
  const insights = (result.data ?? {}) as InsightPayload
  const maxGrid = Math.max(1, ...(insights.attendance_grid ?? []).map((row) => row.count))

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">Back to Township Pulse</Link>
      <div className="mt-5 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-line-impact">Planning signals</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">Insights</h1>
          <p className="mt-2 text-muted-foreground">Cohorts, timing, neighbourhood participation and facility use.</p>
        </div>
        <form method="get" action="/admin/insights" className="flex items-center gap-2">
          <label htmlFor="insight-days" className="sr-only">Period</label>
          <select id="insight-days" name="days" defaultValue={String(days)} className="h-11 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option>
          </select>
          <Button type="submit" className="h-11">Apply</Button>
        </form>
      </div>

      <section className="mt-7 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Attendance by weekday and time</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead><tr><th className="border-b border-border py-2 text-left font-medium">Weekday</th>{["Morning", "Afternoon", "Evening"].map((slot) => <th key={slot} className="border-b border-border py-2 text-left font-medium">{slot}</th>)}</tr></thead>
            <tbody>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((weekday) => (
                <tr key={weekday}><th className="border-b border-border py-3 text-left font-medium">{weekday}</th>{["Morning", "Afternoon", "Evening"].map((slot) => { const value = insights.attendance_grid?.find((row) => row.weekday === weekday && row.slot === slot)?.count ?? 0; return <td key={slot} className="border-b border-border py-3"><span className={`inline-flex min-w-10 justify-center rounded px-2 py-1 tabular-nums ${value ? "bg-line-event/15 text-jom-ink" : "text-muted-foreground"}`}>{value}</span></td> })}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Counts are verified check-ins. Use the numbers as planning signals, not causal proof.</p>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Repeat attendance cohorts</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {(insights.repeat_cohorts ?? []).map((row) => <li key={row.label} className="flex items-center justify-between text-sm"><span>{row.label}</span><strong className="tabular-nums">{row.residents}</strong></li>)}
            {!insights.repeat_cohorts?.length ? <li className="text-sm text-muted-foreground">No repeat cohorts yet.</li> : null}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Neighbourhood participation</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {(insights.neighbourhood_participation ?? []).map((row) => <li key={row.neighbourhood} className="flex items-center justify-between text-sm"><span>{row.neighbourhood}</span><strong className="tabular-nums">{row.residents}</strong></li>)}
            {!insights.neighbourhood_participation?.length ? <li className="text-sm text-muted-foreground">Fewer than 5 residents in each neighbourhood.</li> : null}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{insights.suppression_rule}</p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Facility utilisation</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead><tr><th className="border-b border-border py-2 text-left font-medium">Facility</th><th className="border-b border-border py-2 text-left font-medium">Event hours</th><th className="border-b border-border py-2 text-left font-medium">Available hours</th><th className="border-b border-border py-2 text-left font-medium">Signal</th></tr></thead>
            <tbody>
              {(insights.facility_utilisation ?? []).map((row) => <tr key={row.facility}><th className="border-b border-border py-3 text-left font-medium">{row.facility}</th><td className="border-b border-border py-3 tabular-nums">{row.event_hours}</td><td className="border-b border-border py-3 tabular-nums">{row.available_hours}</td><td className="border-b border-border py-3">{row.underused ? <Badge variant="outline" className="text-jom-ink">Underused</Badge> : <Badge variant="secondary">In use</Badge>}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-muted/40 p-5">
        <h2 className="font-heading text-lg font-semibold">Planning suggestions</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">{(insights.suggestions ?? []).map((suggestion) => <li key={suggestion}>• {suggestion}</li>)}{!insights.suggestions?.length ? <li className="text-muted-foreground">No suggestions from this period.</li> : null}</ul>
      </section>
    </div>
  )
}
