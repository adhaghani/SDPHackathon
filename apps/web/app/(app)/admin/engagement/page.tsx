import { redirect } from "next/navigation"

import { ApproveHighlightForm, CarbonGoalForm } from "@/components/admin/engagement-forms"
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
  const [candidatesResult, goalResult, carbonResult] = await Promise.all([
    supabase.rpc("get_monthly_highlight_candidates", { p_month_start: monthStart }),
    supabase
      .from("township_goals")
      .select("target_co2e_kg,year,is_demo")
      .eq("township_id", active.townshipId)
      .eq("year", year)
      .maybeSingle(),
    supabase.rpc("township_carbon_progress", { p_township_id: active.townshipId }),
  ])
  if (candidatesResult.error) throw new Error(candidatesResult.error.message)
  if (goalResult.error) throw new Error(goalResult.error.message)
  if (carbonResult.error) throw new Error(carbonResult.error.message)
  const candidates = (candidatesResult.data ?? []) as Candidate[]
  const carbon = carbonResult.data as { available?: boolean; partial_data?: boolean; target_co2e_kg?: number } | null

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Engagement"
        description="Approve a public monthly highlight and set the yearly carbon goal. Candidate lists show only opted-in residents and a plain verified reason."
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
          <h2 id="goal-heading" className="text-title text-ink">{year} carbon goal</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Progress appears only when every completed booking category has a documented CO₂e factor and source.
          </p>
          {!carbon?.available && carbon?.partial_data ? (
            <p className="mt-3 rounded-lg bg-coral-tint p-3 text-sm text-ink">Some category factors are missing, so progress remains hidden.</p>
          ) : null}
          <CarbonGoalForm year={year} targetKg={Number(goalResult.data?.target_co2e_kg ?? carbon?.target_co2e_kg ?? undefined)} />
          <p className="mt-4 text-xs text-ink-muted">Target and resulting progress are labelled Estimated and explained in Methodology.</p>
        </section>
      </div>
    </div>
  )
}
