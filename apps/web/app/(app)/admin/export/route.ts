import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { getSessionContext } from "@/lib/data"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "authentication_required" }, { status: 401 })

  const context = await getSessionContext()
  const member = context.membership
  if (!member || member.role !== "township_admin" || member.status !== "active") {
    return NextResponse.json({ error: "admin_required" }, { status: 403 })
  }
  const townshipId = member.township_id

  const [pulseResult, economyResult, demandResult, forecastResult] = await Promise.all([
    supabase.rpc("township_pulse", { p_township_id: townshipId, p_days: 90 }),
    supabase.rpc("admin_rewards_economy", { p_township_id: townshipId, p_days: 90 }),
    supabase.rpc("admin_demand_gaps", { p_township_id: townshipId }),
    supabase.rpc("predictive_demand", { p_township_id: townshipId }),
  ])
  if (pulseResult.error || economyResult.error || demandResult.error || forecastResult.error) {
    return NextResponse.json({ error: "export_failed" }, { status: 500 })
  }

  const pulse = (pulseResult.data ?? {}) as { metrics?: Record<string, number | string> }
  const economy = (economyResult.data ?? {}) as Record<string, number>
  const demand = (demandResult.data ?? []) as Array<{
    key: string
    label: string
    searches: number
    open_requests: number
    available_items: number
    gap: number
  }>
  const forecast = (forecastResult.data ?? {}) as {
    available?: boolean
    event?: { name?: string }
    forecasts?: Array<{ category_name: string; baseline_weekly_demand: number; uplift: number; forecast: number }>
  }
  const rows = [
    ["metric", "value"],
    ...Object.entries(pulse.metrics ?? {}).map(([key, value]) => [key, String(value)]),
    ...Object.entries(economy).map(([key, value]) => [key, String(value)]),
    ...demand.map((gap) => [
      `demand_gap:${gap.key}`,
      `${gap.searches} searches; ${gap.open_requests} open requests; ${gap.available_items} available; gap ${gap.gap}`,
    ]),
    ...(forecast.available && forecast.event?.name
      ? (forecast.forecasts ?? []).map((row) => [
          `forecast:${row.category_name}`,
          `${row.forecast} for ${forecast.event?.name}; baseline ${row.baseline_weekly_demand}/week; uplift ${row.uplift}; Forecast`,
        ])
      : []),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="borrowlah-aggregates-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  })
}
