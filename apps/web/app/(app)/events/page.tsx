import Link from "next/link"
import { PlusIcon, SearchIcon } from "lucide-react"

import { PageBand } from "@/components/shared/page-band"
import { MediaPoster } from "@/components/shared/media-poster"
import { Pagination } from "@/components/shared/pagination"
import { EventFilterDialog } from "@/components/shared/filter-dialog"
import { LazyEventMap } from "@/components/map/lazy-event-map"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate, formatEventTime } from "@/lib/format"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()
  const pageSize = 12
  const page = Math.max(1, Number(params.page ?? 1) || 1)
  const offset = (page - 1) * pageSize

  const categoriesResult = await supabase
    .from("event_categories")
    .select("id,slug,name,counts_as_sustainability")
    .order("name")

  let query = supabase
    .from("events")
    .select("id,title,description,cover_path,starts_at,ends_at,location_text,status,capacity,event_categories(slug,name,counts_as_sustainability),facilities(name),neighbourhoods(name)", { count: "exact" })
    .eq("township_id", active.townshipId)
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (params.category) query = query.eq("event_categories.slug", params.category)
  if (params.q) query = query.ilike("title", `%${params.q}%`)

  const [eventsResult] = await Promise.all([query])
  if (eventsResult.error) throw new Error(eventsResult.error.message)
  const totalPages = Math.max(1, Math.ceil((eventsResult.count ?? 0) / pageSize))
  const mapMarkers = (eventsResult.data ?? []).map((event) => ({
    id: event.id,
    title: event.title,
    location: event.location_text,
    neighbourhood: event.neighbourhoods?.name,
    facility: event.facilities?.name,
  }))

  const categories = categoriesResult.data ?? []
  const events = eventsResult.data ?? []

  return (
    <div className="flex flex-col gap-5">
      <PageBand
        className="mb-0"
        eyebrow="Jom · Events"
        title="Events"
        description="Join something nearby. Points are given when you check in with your QR ticket."
        actions={
          <>
            <Button render={<Link href="/events/mine" />} variant="outline">Your events</Button>
            <Button render={<Link href="/events/new" />} variant="cta" size="cta">
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              Host an event
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/events" method="get" role="search" className="min-w-0 flex-1">
          {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
          <label className="sr-only" htmlFor="q">Search events</label>
          <div className="flex h-13 w-full items-center gap-3 rounded-lg border border-ink-muted bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
            <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" strokeWidth={1.8} />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder="Search clean-ups, repair cafés, markets…"
              className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
            />
            <Button type="submit" variant="ghost" size="sm" className="shrink-0">Search</Button>
          </div>
        </form>
        <EventFilterDialog categories={categories} activeCategory={params.category} query={params.q} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-ink-muted tabular-nums">
          {(eventsResult.count ?? 0).toLocaleString("en-MY")} upcoming {eventsResult.count === 1 ? "event" : "events"}
        </p>
      </div>

      {events.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <li key={event.id} className="min-w-0">
              <Link href={`/events/${event.id}`} className="block rounded-lg transition-shadow duration-150 ease-out">
                <MediaPoster
                  src={event.cover_path ?? "/demo/event-placeholder.svg"}
                  alt=""
                  eyebrow={`Jom · ${event.event_categories?.name ?? "Event"}`}
                  title={event.title}
                  meta={[
                    `${formatEventDate(event.starts_at).replace(/ \d{4}$/, "")} · ${formatEventTime(event.starts_at)}`,
                    event.location_text,
                  ]}
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="bb-card">
          <EmptyHeader>
            <EmptyTitle>No events match this search</EmptyTitle>
            <EmptyDescription>Try another category, or host one at a shared space.</EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/events/new" />} variant="cta">Host an event</Button>
        </Empty>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/events" searchParams={{ q: params.q, category: params.category }} />

      {mapMarkers.length ? (
        <section aria-labelledby="event-map-heading" className="mt-2">
          <h2 id="event-map-heading" className="text-heading text-ink">Meetup map</h2>
          <p className="mt-1 text-sm text-ink-muted">Approximate shared-space locations for this page of events.</p>
          <LazyEventMap className="mt-4" markers={mapMarkers} />
        </section>
      ) : null}
    </div>
  )
}
