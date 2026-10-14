import Link from "next/link"
import { redirect } from "next/navigation"

import { SectionRetry } from "@/components/home/section-retry"
import { WishlistForm } from "@/components/admin/wishlist-form"
import { CalendarVerificationActions } from "@/components/admin/calendar-verification-actions"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

type DemandGap = {
  key: string
  label: string
  category_slug?: string | null
  unique_residents?: number | null
  identity_coverage?: string
  searches: number
  open_requests: number
  available_items: number
  gap: number
}

type SupplyOutcomes = {
  programme_cost_rm?: number
  categories?: Array<{
    category: string
    searches: number
    unique_residents: number | null
    units_supplied: number
    stocked_listings: number
    used_listings: number
    completed_loans: number
  }>
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
  const [
    gapsResult,
    forecastResult,
    calendarResult,
    wishlistResult,
    supplyResult,
  ] = await Promise.all([
    supabase.rpc("admin_demand_gaps", { p_township_id: active.townshipId }),
    supabase.rpc("predictive_demand", { p_township_id: active.townshipId }),
    supabase
      .from("calendar_events")
      .select(
        "id,name,event_type,starts_on,ends_on,source_name,source_url,verification_status"
      )
      .gte("starts_on", new Date().toISOString().slice(0, 10))
      .order("starts_on")
      .limit(12),
    supabase
      .from("shared_library_wishlists")
      .select(
        "id,requested_label,normalized_term,is_demo,item_categories(name)"
      )
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false }),
    supabase.rpc("admin_supply_outcomes", { p_township_id: active.townshipId }),
  ])
  if (gapsResult.error) throw new Error(gapsResult.error.message)
  if (forecastResult.error) throw new Error(forecastResult.error.message)
  if (calendarResult.error) throw new Error(calendarResult.error.message)
  if (wishlistResult.error) throw new Error(wishlistResult.error.message)
  const gaps = (gapsResult.data ?? []) as DemandGap[]
  const forecast = (forecastResult.data ?? {}) as ForecastPayload
  const upcoming = calendarResult.data ?? []
  const wishlists = wishlistResult.data ?? []
  const supply = (supplyResult.data ?? {}) as SupplyOutcomes

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        title="Demand intelligence"
        description="Turn resident demand into shared equipment and confirmed loans."
        className="mb-4 [&_h1]:text-h2"
        actions={
          <Button render={<Link href="/admin/export" />} variant="outline">
            Download CSV
          </Button>
        }
      />

      <p className="mb-4 text-sm text-ink-muted">
        Resident demand is shown only for groups of at least five; anonymous
        legacy demo searches have no resident count.
      </p>
      <section aria-labelledby="supply-heading" className="bb-card p-4">
        <h2 id="supply-heading" className="text-title text-ink">
          Demand → equipment supplied → completed loans
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Last 30 days of searches and confirmed shared-library loans. Stock is
          current hub inventory. Repeated searches are counted separately from
          residents. The category table includes searches with a selected
          category; uncategorised searches appear in the demand gaps below.
        </p>
        {supplyResult.error ? (
          <SectionRetry label="Equipment outcomes" />
        ) : (
          <>
            <p className="mt-3 font-bold">
              Programme costs this calendar month: RM{" "}
              {Number(supply.programme_cost_rm ?? 0).toFixed(2)}{" "}
              <Link
                href="/admin/budget"
                className="underline underline-offset-4"
              >
                Review costs
              </Link>
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Demand and shared equipment outcomes by category
                </caption>
                <thead>
                  <tr>
                    {[
                      "Category",
                      "Categorised searches",
                      "Distinct residents",
                      "Units supplied",
                      "Completed loans",
                      "Listing utilisation",
                    ].map((label) => (
                      <th key={label} className="px-3 py-2">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(supply.categories ?? []).map((row) => (
                    <tr key={row.category} className="border-t border-hairline">
                      <th scope="row" className="px-3 py-2">
                        {row.category}
                      </th>
                      <td className="px-3 py-2">{row.searches}</td>
                      <td className="px-3 py-2">
                        {row.unique_residents ?? "Fewer than 5 / unrecorded"}
                      </td>
                      <td className="px-3 py-2">{row.units_supplied}</td>
                      <td className="px-3 py-2">{row.completed_loans}</td>
                      <td className="px-3 py-2">
                        {row.stocked_listings
                          ? `${Math.round((100 * row.used_listings) / row.stocked_listings)}%`
                          : "No stock"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Listing utilisation = stocked listings with at least one completed
              loan ÷ all stocked listings. It is not time-based occupancy. Costs
              cover the current month and are not attributed to individual
              categories. These signals support purchasing decisions; they do
              not prove a purchase caused a loan.
            </p>
          </>
        )}
      </section>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <div className="grid gap-4">
          <section aria-labelledby="demand-gap-heading" className="bb-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="demand-gap-heading" className="text-title text-ink">
                Most wanted, not available
              </h2>
              <span className="text-sm text-ink-muted">Last 30 days</span>
            </div>
            {gaps.length ? (
              <ul className="mt-4 divide-y divide-hairline">
                {gaps.map((gap) => (
                  <li key={gap.key} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-ink">{gap.label}</p>
                        <p className="mt-1 text-sm text-ink-muted tabular-nums">
                          {gap.searches} searches ·{" "}
                          {gap.unique_residents ?? "not recorded (legacy demo)"}{" "}
                          distinct residents · {gap.open_requests} open requests
                          · {gap.available_items} available
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
                  <EmptyDescription>
                    At least five distinct residents are needed for a demand
                    bucket. Legacy demo search counts are labelled separately.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </section>

          <section aria-labelledby="wishlist-heading" className="bb-card p-4">
            <h2 id="wishlist-heading" className="text-title text-ink">
              Shared library wishlist
            </h2>
            {wishlists.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {wishlists.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-full bg-lilac-tint px-3 py-1 text-sm font-bold text-ink"
                  >
                    {item.requested_label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-surface p-4 text-sm text-ink-muted">
                Nothing has been added to the shared wishlist.
              </p>
            )}
          </section>
        </div>
        <div className="grid gap-4">
          <section aria-labelledby="forecast-heading" className="bb-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="forecast-heading" className="text-title text-ink">
                Predictive demand
              </h2>
              <Badge variant="secondary">Forecast</Badge>
            </div>
            {forecast.available && forecast.event ? (
              <>
                <p className="mt-3 text-sm text-ink-muted">
                  Expect high demand around{" "}
                  <strong className="text-ink">{forecast.event.name}</strong> on{" "}
                  {forecast.event.starts_on}.
                </p>
                <p className="mt-2 text-xs text-ink-muted">
                  Source:{" "}
                  <a
                    href={forecast.event.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-ink underline underline-offset-4"
                  >
                    {forecast.event.source_name}
                  </a>{" "}
                  ·{" "}
                  {forecast.event.verification_status === "verified"
                    ? "Date verified"
                    : "Date needs review"}
                </p>
                <ul className="mt-4 divide-y divide-hairline">
                  {(forecast.forecasts ?? []).map((row) => (
                    <li
                      key={row.category_slug}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-bold text-ink">
                          {row.category_name}
                        </p>
                        <p className="text-xs text-ink-muted tabular-nums">
                          baseline {row.baseline_weekly_demand.toFixed(1)} /
                          week · ×{row.uplift} uplift
                        </p>
                      </div>
                      <strong className="tabular-nums">
                        {row.forecast.toFixed(1)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Empty className="mt-4">
                <EmptyHeader>
                  <EmptyTitle>No forecast window</EmptyTitle>
                  <EmptyDescription>
                    No official-source festival or school holiday falls in the
                    next 14 days.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            <p className="mt-4 text-xs text-ink-muted">
              Heuristic baseline from the last eight weeks multiplied by a
              reviewed festival uplift. Always labelled Forecast.
            </p>
          </section>

          <section aria-labelledby="calendar-heading" className="bb-card p-4">
            <h2 id="calendar-heading" className="text-title text-ink">
              Calendar verification queue
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Every seeded date points to an official PDF and remains marked for
              your review.
            </p>
            {upcoming.length ? (
              <ul className="mt-4 divide-y divide-hairline">
                {upcoming.map((event) => (
                  <li key={event.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-ink">{event.name}</p>
                        <p className="text-sm text-ink-muted">
                          {event.starts_on}
                          {event.ends_on !== event.starts_on
                            ? ` – ${event.ends_on}`
                            : ""}
                        </p>
                        <a
                          href={event.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-ink underline underline-offset-4"
                        >
                          {event.source_name}
                        </a>
                      </div>
                      <Badge
                        variant={
                          event.verification_status === "verified"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {event.verification_status === "verified"
                          ? "Verified"
                          : "Needs review"}
                      </Badge>
                    </div>
                    <CalendarVerificationActions
                      eventId={event.id}
                      currentStatus={event.verification_status}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-surface p-4 text-sm text-ink-muted">
                No upcoming calendar entries.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
