import { redirect } from "next/navigation"

import { ApproveHighlightForm, CarbonGoalForm } from "@/components/admin/engagement-forms"
import { RecyclingCampaignForm, RecyclingFactorForm, type ExistingRecyclingCampaign, type RecyclingMaterialFactor } from "@/components/admin/recycling-forms"
import { CarbonFactorForm } from "@/components/admin/carbon-factor-form"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

type Candidate = {
  resident_id: string
  display_name: string
  reason: string
}

export default async function AdminEngagementPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const year = now.getFullYear()
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(now)
  const defaultEnd = new Date(`${today}T00:00:00Z`)
  defaultEnd.setUTCDate(defaultEnd.getUTCDate() + 30)
  const [
    candidatesResult,
    goalResult,
    carbonResult,
    categoriesResult,
    trustResult,
    recyclingCampaignsResult,
    recyclingProgressResult,
    recyclingMaterialsResult,
  ] = await Promise.all([
    supabase.rpc("get_monthly_highlight_candidates", { p_month_start: monthStart }),
    supabase
      .from("township_goals")
      .select("target_co2e_kg,year,is_demo")
      .eq("township_id", active.townshipId)
      .eq("year", year)
      .maybeSingle(),
    supabase.rpc("township_carbon_progress", { p_township_id: active.townshipId }),
    supabase.from("item_categories").select("slug,name,co2e_kg_per_borrow,co2e_source").order("name"),
    supabase.rpc("trust_tier_distribution", { p_township_id: active.townshipId }),
    supabase
      .from("recycling_campaigns")
      .select("id,title,starts_on,ends_on,target_kg,status")
      .eq("township_id", active.townshipId)
      .order("starts_on", { ascending: false })
      .limit(5),
    supabase.rpc("township_recycling_progress", { p_township_id: active.townshipId }),
    supabase
      .from("recycling_materials")
      .select("slug,name,co2e_kg_per_kg,energy_kwh_per_kg,factor_source")
      .eq("active", true)
      .order("sort_order"),
  ])
  if (candidatesResult.error) throw new Error(candidatesResult.error.message)
  if (goalResult.error) throw new Error(goalResult.error.message)
  if (carbonResult.error) throw new Error(carbonResult.error.message)
  if (categoriesResult.error) throw new Error(categoriesResult.error.message)
  if (trustResult.error) throw new Error(trustResult.error.message)
  if (recyclingCampaignsResult.error) throw new Error(recyclingCampaignsResult.error.message)
  if (recyclingProgressResult.error) throw new Error(recyclingProgressResult.error.message)
  if (recyclingMaterialsResult.error) throw new Error(recyclingMaterialsResult.error.message)
  const candidates = (candidatesResult.data ?? []) as Candidate[]
  const carbon = carbonResult.data as { available?: boolean; partial_data?: boolean; target_co2e_kg?: number } | null
  const categories = (categoriesResult.data ?? []) as Array<{
    slug: string
    name: string
    co2e_kg_per_borrow?: number | null
    co2e_source?: string | null
  }>
  const trust = (trustResult.data ?? {}) as {
    building?: number | null
    trusted?: number | null
    highly_trusted?: number | null
    suppression_rule?: string
  }
  const recyclingCampaignRows = (recyclingCampaignsResult.data ?? []) as Array<{
    id: string
    title: string
    starts_on: string
    ends_on: string
    target_kg: number
    status: "active" | "completed" | "ended" | "cancelled"
  }>
  const selectedCampaignRow =
    recyclingCampaignRows.find((campaign) => campaign.status === "active") ?? recyclingCampaignRows[0]
  const selectedCampaign: ExistingRecyclingCampaign | undefined = selectedCampaignRow
    ? {
        id: selectedCampaignRow.id,
        title: selectedCampaignRow.title,
        startsOn: selectedCampaignRow.starts_on,
        endsOn: selectedCampaignRow.ends_on,
        targetKg: Number(selectedCampaignRow.target_kg),
        status: selectedCampaignRow.status,
      }
    : undefined
  const recyclingProgress = (recyclingProgressResult.data ?? {}) as {
    has_campaign?: boolean
    title?: string
    current_kg?: number
    target_kg?: number
    percent?: number
    status?: string
    completed?: boolean
  }
  const recyclingMaterials = (recyclingMaterialsResult.data ?? []) as Array<{
    slug: string
    name: string
    co2e_kg_per_kg: number | null
    energy_kwh_per_kg: number | null
    factor_source: string | null
  }>
  const recyclingFactorMaterials: RecyclingMaterialFactor[] = recyclingMaterials.map((material) => ({
    slug: material.slug,
    name: material.name,
    co2eKgPerKg: material.co2e_kg_per_kg == null ? null : Number(material.co2e_kg_per_kg),
    energyKwhPerKg: material.energy_kwh_per_kg == null ? null : Number(material.energy_kwh_per_kg),
    factorSource: material.factor_source,
  }))

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Engagement"
        description="Approve a public highlight, manage borrowing carbon factors and set the resident recycling campaign. Candidate lists show only opted-in residents."
      />
      <div className="mt-7 grid gap-7 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="highlight-heading" className="bb-card p-5">
          <h2 id="highlight-heading" className="text-title text-ink">Neighbour of the month</h2>
          <p className="mt-1 text-sm text-ink-muted">Candidates ranked from last month&apos;s verified lending, fulfilled requests and help.</p>
          {candidates.length ? (
            <ul className="mt-4 space-y-4">
              {candidates.map((candidate) => (
                <li key={candidate.resident_id} className="rounded-lg bg-ground p-4">
                  <p className="font-bold text-ink">{candidate.display_name}</p>
                  <p className="mt-1 text-sm text-ink-muted">{candidate.reason}</p>
                  <ApproveHighlightForm
                    monthStart={monthStart}
                    residentId={candidate.resident_id}
                    initialReason={candidate.reason}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="mt-4">
              <EmptyHeader>
                <EmptyTitle>No eligible candidates</EmptyTitle>
                <EmptyDescription>Residents must opt in, reach Trusted tier and have no open disputes.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        <section aria-labelledby="goal-heading" className="bb-card p-5">
          <h2 id="goal-heading" className="text-title text-ink">{year} borrowing carbon goal</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Progress appears only when every completed booking category has a documented CO₂e factor and source.
          </p>
          {!carbon?.available && carbon?.partial_data ? (
            <p className="mt-3 rounded-lg bg-coral-tint p-3 text-sm text-ink">Some category factors are missing, so progress remains hidden.</p>
          ) : null}
          <CarbonGoalForm year={year} targetKg={Number(goalResult.data?.target_co2e_kg ?? carbon?.target_co2e_kg ?? undefined)} />
          <p className="mt-4 text-xs text-ink-muted">Target and resulting progress are labelled Estimated and explained in Methodology.</p>
          <div className="mt-6 border-t border-hairline pt-5">
            <h3 className="text-title text-ink">Document CO₂e factors</h3>
            <p className="mt-1 text-sm text-ink-muted">Enter a cited factor for every item category before carbon totals can be shown.</p>
            <CarbonFactorForm categories={categories} />
          </div>
        </section>

        <section aria-labelledby="recycling-goal-heading" className="bb-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="recycling-goal-heading" className="text-title text-ink">Recycling campaign</h2>
              <p className="mt-1 text-sm text-ink-muted">
                Set one collective estimated-kg target. Contributors receive 50 BP once when it is reached.
              </p>
            </div>
            {recyclingProgress.has_campaign ? (
              <span className="rounded-full bg-mint-tint px-3 py-1.5 text-xs font-bold text-ink tabular-nums">
                {Math.round(Number(recyclingProgress.percent ?? 0))}% · {Number(recyclingProgress.current_kg ?? 0).toLocaleString("en-MY", { maximumFractionDigits: 1 })} kg
              </span>
            ) : null}
          </div>
          <RecyclingCampaignForm
            townshipId={active.townshipId}
            campaign={selectedCampaign}
            defaults={{ startsOn: today, endsOn: defaultEnd.toISOString().slice(0, 10) }}
          />
          <div className="mt-6 border-t border-hairline pt-5">
            <h3 className="text-title text-ink">Recycling impact factors</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Residents only see CO₂e and kWh totals when every contributing material has factors and a cited source.
            </p>
            <RecyclingFactorForm townshipId={active.townshipId} materials={recyclingFactorMaterials} />
          </div>
        </section>

        <section aria-labelledby="trust-distribution-heading" className="bb-card p-5">
          <h2 id="trust-distribution-heading" className="text-title text-ink">Trust-tier distribution</h2>
          <p className="mt-1 text-sm text-ink-muted">Aggregate only. Tiers below five residents are hidden.</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["Building", trust.building],
              ["Trusted", trust.trusted],
              ["Highly trusted", trust.highly_trusted],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-ground p-4">
                <dt className="text-sm text-ink-muted">{label}</dt>
                <dd className="mt-1 font-display text-3xl font-extrabold text-ink tabular-nums">
                  {value == null ? "—" : Number(value).toLocaleString("en-MY")}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-ink-muted">{trust.suppression_rule}</p>
        </section>
      </div>
    </div>
  )
}
