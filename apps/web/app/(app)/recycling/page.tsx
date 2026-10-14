import Link from "next/link"

import { RecyclingImpactSummary } from "@/components/recycling/impact-summary"
import { RecyclingLogDialog } from "@/components/recycling/log-form"
import { TurtleGoalCard } from "@/components/recycling/turtle-goal-card"
import type { RecyclingMaterial } from "@/components/recycling/types"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { formatRelativeDay } from "@/lib/activity"
import { parseRecyclingCampaign, parseRecyclingSummary } from "@/lib/recycling"
import { createClient } from "@/lib/supabase/server"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function RecyclingPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [materialsResult, summaryResult, campaignResult] = await Promise.all([
    supabase
      .from("recycling_materials")
      .select(
        "id,slug,name,plural_name,sort_order,recycling_units(id,slug,name,unit_label,kg_per_unit,sort_order)"
      )
      .eq("active", true)
      .order("sort_order"),
    supabase.rpc("resident_recycling_summary", {
      p_township_id: active.townshipId,
      p_user_id: active.user.id,
    }),
    supabase.rpc("township_recycling_progress", { p_township_id: active.townshipId }),
  ])

  if (materialsResult.error) throw new Error(materialsResult.error.message)
  if (summaryResult.error) throw new Error(summaryResult.error.message)
  if (campaignResult.error) throw new Error(campaignResult.error.message)

  const materials = (materialsResult.data ?? []).map((material) => ({
    id: material.id,
    slug: material.slug,
    name: material.name,
    pluralName: material.plural_name,
    units: (material.recycling_units ?? [])
      .slice()
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((unit) => ({
        id: unit.id,
        slug: unit.slug,
        name: unit.name,
        unitLabel: unit.unit_label,
        kgPerUnit: Number(unit.kg_per_unit),
      })),
  })) as RecyclingMaterial[]

  const summary = parseRecyclingSummary((summaryResult.data ?? {}) as Record<string, unknown>)
  const campaign = parseRecyclingCampaign((campaignResult.data ?? {}) as Record<string, unknown>)
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date())
  const maxBreakdown = Math.max(1, ...summary.materialBreakdown.map((row) => row.kg))

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        back={{ href: "/home", label: "Home" }}
        eyebrow="Rimba · Impact"
        title="Recycling log"
        description="Keep a lightweight estimate of what you recycle. Counts are converted to kilograms on the server, then translated into estimated CO₂e and energy equivalents."
        actions={
          <Link
            href="/admin/methodology"
            className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-4 text-sm font-bold text-ink hover:bg-white"
          >
            How estimates work
          </Link>
        }
      />

      <RecyclingLogDialog materials={materials} townshipId={active.townshipId} currentDate={today} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)] lg:items-start">
        <RecyclingImpactSummary summary={summary} compact />
        <TurtleGoalCard campaign={campaign} className="lg:sticky lg:top-6" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="breakdown-heading" className="bb-card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-eyebrow text-ink-muted">Lifetime estimate</p>
              <h2 id="breakdown-heading" className="text-h2 mt-1 text-ink">
                By material
              </h2>
            </div>
            <span className="text-xs text-ink-soft tabular-nums">
              {summary.materialBreakdown.length} material{summary.materialBreakdown.length === 1 ? "" : "s"}
            </span>
          </div>
          {summary.materialBreakdown.length ? (
            <ul className="mt-5 space-y-4">
              {summary.materialBreakdown.map((row) => (
                <li key={row.slug}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-bold text-ink">{row.name}</span>
                    <span className="font-bold text-ink tabular-nums">
                      {row.kg.toLocaleString("en-MY", { maximumFractionDigits: 2 })} kg
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-mint-tint">
                    <div
                      className="h-full rounded-full bg-ink motion-safe:transition-[width] duration-500"
                      style={{ width: `${Math.max(4, (row.kg / maxBreakdown) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="mt-4">
              <EmptyHeader>
                <EmptyTitle>No estimates yet</EmptyTitle>
                <EmptyDescription>Your material breakdown will appear after your first log.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        <section aria-labelledby="recent-logs-heading" className="bb-card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-eyebrow text-ink-muted">Recent activity</p>
              <h2 id="recent-logs-heading" className="text-h2 mt-1 text-ink">
                Your latest estimates
              </h2>
            </div>
          </div>
          {summary.recentLogs.length ? (
            <ul className="mt-5 divide-y divide-hairline border-y border-hairline">
              {summary.recentLogs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">{formatRelativeDay(log.occurredOn)}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {log.method === "custom_kg" ? "Custom weight" : "Item count"}
                    </p>
                  </div>
                  {log.photoPaths.length ? (
                    <ul aria-label="Estimate photos" className="flex gap-1.5">
                      {log.photoPaths.slice(0, 3).map((photo, index) => (
                        <li
                          key={photo}
                          aria-label={`Recycling photo ${index + 1}`}
                          role="img"
                          className="size-9 rounded-[8px] border border-hairline bg-cover bg-center"
                          style={{ backgroundImage: `url("${photo}")` }}
                        />
                      ))}
                    </ul>
                  ) : null}
                  <span className="shrink-0 rounded-full bg-mint-tint px-2.5 py-1 text-sm font-bold text-ink tabular-nums">
                    {log.totalKg.toLocaleString("en-MY", { maximumFractionDigits: 2 })} kg
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="mt-4">
              <EmptyHeader>
                <EmptyTitle>Nothing logged yet</EmptyTitle>
                <EmptyDescription>Add a quick count after your next recycling drop-off.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
    </div>
  )
}
