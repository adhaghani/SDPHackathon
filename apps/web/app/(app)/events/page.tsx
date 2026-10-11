import Link from "next/link"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { formatEventRange } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

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
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-jom-ink">Jom · Events</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">Things to do nearby</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Join a verified activity, or host one for your neighbours.
          </p>
        </div>
        <Button render={<Link href="/events/new" />} className="h-11">
          Host an event
        </Button>
      </section>

      <form className="flex flex-col gap-3 border-y border-border py-4 sm:flex-row" action="/events" method="get">
        <label className="sr-only" htmlFor="q">
          Search events
        </label>
        <input
          id="q"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search events"
          className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <label className="sr-only" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={params.category ?? ""}
          className="h-10 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">All categories</option>
          {(categoriesResult.data ?? []).map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" className="h-10">
          Filter
        </Button>
      </form>

      <ul className="divide-y divide-border border-y border-border">
        {(eventsResult.data ?? []).map((event) => (
          <li key={event.id}>
            <Link
              href={`/events/${event.id}`}
              className="flex flex-col gap-3 py-5 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={event.event_categories?.counts_as_sustainability ? "text-rimba-ink" : "text-jom-ink"}>
                    {event.event_categories?.name ?? "Event"}
                  </Badge>
                  {event.capacity ? <span className="text-xs text-muted-foreground">Capacity {event.capacity}</span> : null}
                </div>
                <h2 className="mt-2 font-heading text-lg font-semibold">{event.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{formatEventRange(event.starts_at, event.ends_at)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{event.location_text}</p>
              </div>
              <span className="shrink-0 text-sm font-medium text-line-borrow">View event</span>
            </Link>
          </li>
        ))}
        {eventsResult.data?.length === 0 ? (
          <li className="py-10 text-center text-muted-foreground">
            No events match this search. Host one or browse next week.
          </li>
        ) : null}
      </ul>
    </div>
  )
}
