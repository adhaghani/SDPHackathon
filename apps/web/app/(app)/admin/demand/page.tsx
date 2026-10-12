import Link from "next/link"
import { redirect } from "next/navigation"

import { WishlistForm } from "@/components/admin/wishlist-form"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

type DemandGap = {
  key: string
  label: string
  category_slug?: string | null
  searches: number
  open_requests: number
  available_items: number
  gap: number
}

type ForecastPayload = {
  available?: boolean
  event?: {
    name?: string
    starts_on?: string
    source_name?: string
    source_url?: string
    verification_status?: string
  }
  forecasts?: Array<{
    category_slug: string
    category_name: string
    baseline_weekly_demand: number
    uplift: number
    forecast: number
  }>
}

export default async function AdminDemandPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const [gapsResult, forecastResult, calendarResult, wishlistResult] = await Promise.all([
    supabase.rpc("admin_demand_gaps", { p_township_id: active.townshipId }),
    supabase.rpc("predictive_demand", { p_township_id: active.townshipId }),
    supabase
      .from("calendar_events")
      .select("id,name,event_type,starts_on,ends_on,source_name,source_url,verification_status")
      .gte("starts_on", new Date().toISOString().slice(0, 10))
      .order("starts_on")
      .limit(12),
    supabase
      .from("shared_library_wishlists")
      .select("id,requested_label,normalized_term,is_demo,item_categories(name)")
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false }),
  ])
  if (gapsResult.error) throw new Error(gapsResult.error.message)
  if (forecastResult.error) throw new Error(forecastResult.error.message)
  if (calendarResult.error) throw new Error(calendarResult.error.message)
  if (wishlistResult.error) throw new Error(wishlistResult.error.message)
  const gaps = (gapsResult.data ?? []) as DemandGap[]
  const forecast = (forecastResult.data ?? {}) as ForecastPayload
  const upcoming = calendarResult.data ?? []
  const wishlists = wishlistResult.data ?? []

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Demand intelligence"
        description="Aggregate-only signals for purchasing and preparation. Buckets with fewer than five search events are hidden."
        actions={<Button render={<Link href="/admin/export" />} variant="outline">Download CSV</Button>}
      />

      <div className="mt-7 grid gap-7 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="demand-gap-heading" className="bb-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="demand-gap-heading" className="text-title text-ink">Most wanted, not available</h2>
            <span className="text-sm text-ink-muted">Last 30 days</span>
          </div>
          {gaps.length ? (
            <ul className="mt-4 divide-y divide-hairline">
              {gaps.map((gap) => (
                <li key={gap.key} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{gap.label}</p>
                      <p className="mt-1 text-sm text-ink-muted tabular-nums">
                        {gap.searches} searches · {gap.open_requests} open requests · {gap.available_items} available
                      </p>
                    </div>
                    <span className="rounded-full bg-coral-tint px-3 py-1 text-sm font-bold text-ink tabular-nums">
                      gap {gap.gap}
                    </span>
                  </div>
                  <WishlistForm
                    categorySlug={gap.category_slug ?? ""}
                    normalizedTerm={gap.key}
                    initialLabel={`${gap.label} for the shared library`}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="mt-4">
              <EmptyHeader>
                <EmptyTitle>No demand gaps yet</EmptyTitle>
                <EmptyDescription>At least five matching search events are needed before a bucket appears.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>

        <section aria-labelledby="forecast-heading" className="bb-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="forecast-heading" className="text-title text-ink">Predictive demand</h2>
            <Badge variant="secondary">Forecast</Badge>
          </div>
          {forecast.available && forecast.event ? (
            <>
              <p className="mt-3 text-sm text-ink-muted">
                Expect high demand around <strong className="text-ink">{forecast.event.name}</strong> on {forecast.event.starts_on}.
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                Source:{" "}
                <a href={forecast.event.source_url} target="_blank" rel="noreferrer" className="font-bold text-ink underline underline-offset-4">
                  {forecast.event.source_name}
                </a>{" "}
                · {forecast.event.verification_status === "verified" ? "Date verified" : "Date needs review"}
              </p>
              <ul className="mt-4 divide-y divide-hairline">
                {(forecast.forecasts ?? []).map((row) => (
                  <li key={row.category_slug} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-bold text-ink">{row.category_name}</p>
                      <p className="text-xs text-ink-muted tabular-nums">
                        baseline {row.baseline_weekly_demand.toFixed(1)} / week · ×{row.uplift} uplift
                      </p>
                    </div>
                    <strong className="tabular-nums">{row.forecast.toFixed(1)}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty className="mt-4">
              <EmptyHeader>
                <EmptyTitle>No forecast window</EmptyTitle>
                <EmptyDescription>No official-source festival or school holiday falls in the next 14 days.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          <p className="mt-4 text-xs text-ink-muted">
            Heuristic baseline from the last eight weeks multiplied by a reviewed festival uplift. Always labelled Forecast.
          </p>
        </section>

        <section aria-labelledby="calendar-heading" className="bb-card p-5">
          <h2 id="calendar-heading" className="text-title text-ink">Calendar verification queue</h2>
          <p className="mt-1 text-sm text-ink-muted">Every seeded date points to an official PDF and remains marked for your review.</p>
          {upcoming.length ? (
            <ul className="mt-4 divide-y divide-hairline">
              {upcoming.map((event) => (
                <li key={event.id} className="py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-ink">{event.name}</p>
                      <p className="text-sm text-ink-muted">{event.starts_on}{event.ends_on !== event.starts_on ? ` – ${event.ends_on}` : ""}</p>
                      <a href={event.source_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-ink underline underline-offset-4">
                        {event.source_name}
                      </a>
                    </div>
                    <Badge variant={event.verification_status === "verified" ? "secondary" : "outline"}>
                      {event.verification_status === "verified" ? "Verified" : "Needs review"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg bg-surface p-4 text-sm text-ink-muted">No upcoming calendar entries.</p>
          )}
        </section>

        <section aria-labelledby="wishlist-heading" className="bb-card p-5">
          <h2 id="wishlist-heading" className="text-title text-ink">Shared library wishlist</h2>
          {wishlists.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {wishlists.map((item) => (
                <li key={item.id} className="rounded-full bg-lilac-tint px-3 py-1 text-sm font-bold text-ink">
                  {item.requested_label}
                  {item.is_demo ? <span className="ml-2 text-xs text-ink-muted">Demo data</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg bg-surface p-4 text-sm text-ink-muted">Nothing has been added to the shared wishlist.</p>
          )}
        </section>
      </div>
    </div>
  )
}
