import Link from "next/link"
import { CalendarDaysIcon, SearchIcon } from "lucide-react"

import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { formatEventRange } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()

  const categoriesResult = await supabase
    .from("event_categories")
    .select("id,slug,name,counts_as_sustainability")
    .order("name")

  let query = supabase
    .from("events")
    .select("id,title,description,starts_at,ends_at,location_text,status,capacity,event_categories(slug,name,counts_as_sustainability)")
    .eq("township_id", active.townshipId)
    .eq("status", "published")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(30)

  if (params.category) query = query.eq("event_categories.slug", params.category)
  if (params.q) query = query.ilike("title", `%${params.q}%`)

  const [eventsResult] = await Promise.all([query])
  if (eventsResult.error) throw new Error(eventsResult.error.message)

  return (
    <div className="flex flex-col gap-4">
      <PageBand
        eyebrow="Jom · Events"
        title="Things to do nearby"
        description="Join a verified activity, or host one for your neighbours."
        actions={<Button render={<Link href="/events/new" />} variant="cta" size="cta">Host an event</Button>}
      >
        <form className="flex flex-col gap-3 sm:flex-row" action="/events" method="get">
          <label className="sr-only" htmlFor="q">Search events</label>
          <div className="flex h-[52px] min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-surface px-4 shadow-card focus-within:border-ring">
            <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" strokeWidth={1.8} />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder="Search events"
              className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted/70"
            />
          </div>
          <label className="sr-only" htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            defaultValue={params.category ?? ""}
            className="h-[52px] rounded-lg border border-border bg-surface px-3 text-base text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All categories</option>
            {(categoriesResult.data ?? []).map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="h-[52px]">Filter</Button>
        </form>
      </PageBand>

      {(eventsResult.data ?? []).length ? (
        <ul className="grid gap-3.5 sm:grid-cols-2">
          {eventsResult.data?.map((event) => (
            <li key={event.id}>
              <Link href={`/events/${event.id}`} className="bb-card flex h-full flex-col p-4 hover:bg-lilac-tint">
                <div className="flex items-start justify-between gap-3">
                  <CalendarDaysIcon aria-hidden="true" className="size-6 text-ink" strokeWidth={1.8} />
                  <Badge variant={event.event_categories?.counts_as_sustainability ? "secondary" : "outline"}>
                    {event.event_categories?.name ?? "Event"}
                  </Badge>
                </div>
                <h2 className="mt-4 font-display text-lg text-ink">{event.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{formatEventRange(event.starts_at, event.ends_at)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.location_text}</p>
                {event.capacity ? <p className="mt-3 text-xs font-bold text-ink-muted">Capacity {event.capacity}</p> : null}
                <span className="mt-4 text-sm font-bold text-ink">View event</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="bb-card">
          <EmptyHeader>
            <EmptyTitle>No events match this search.</EmptyTitle>
            <EmptyDescription>Host one or browse next week.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
