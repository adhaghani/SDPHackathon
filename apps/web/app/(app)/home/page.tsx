import Image from "next/image"
import Link from "next/link"

import { requireActiveMember } from "@/lib/data"
import { formatEventRange } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function HomePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [bookingsResult, eventsResult, itemsResult, ledgerResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,status,borrower_id,lender_id,items(title)")
      .or(`borrower_id.eq.${active.user.id},lender_id.eq.${active.user.id}`)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("events")
      .select("id,title,starts_at,ends_at,location_text,neighbourhood_id,event_categories(name,counts_as_sustainability)")
      .eq("township_id", active.townshipId)
      .eq("status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(3),
    supabase
      .from("items")
      .select("id,title,condition,photo_paths,item_categories(name)")
      .eq("township_id", active.townshipId)
      .eq("status", "active")
      .neq("owner_id", active.user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("points_ledger")
      .select("id,delta,action_type,created_at")
      .eq("user_id", active.user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  const todos = (bookingsResult.data ?? [])
    .map((booking) => {
      if (booking.borrower_id === active.user.id && booking.status === "approved") return { id: booking.id, label: `Confirm handover for ${booking.items?.title ?? "your borrow"}`, href: `/borrow/bookings/${booking.id}` }
      if (booking.borrower_id === active.user.id && booking.status === "handed_over") return { id: booking.id, label: `Mark ${booking.items?.title ?? "your borrow"} returned`, href: `/borrow/bookings/${booking.id}` }
      if (booking.lender_id === active.user.id && booking.status === "requested") return { id: booking.id, label: `Review request for ${booking.items?.title ?? "your item"}`, href: `/borrow/bookings/${booking.id}` }
      if (booking.lender_id === active.user.id && booking.status === "handed_over") return { id: booking.id, label: `Confirm return of ${booking.items?.title ?? "your item"}`, href: `/borrow/bookings/${booking.id}` }
      return null
    })
    .filter((todo): todo is { id: string; label: string; href: string } => Boolean(todo))
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm font-medium text-rimba-ink">Your next stop</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold sm:text-4xl">
          Home, {active.profile?.display_name?.split(" ")[0] ?? "neighbour"}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A practical view of what needs you, what is happening nearby and what your township has recognised.
        </p>
      </section>

      <section aria-labelledby="todo-heading" className="border-y border-border">
        <div className="flex items-center justify-between py-4">
          <h2 id="todo-heading" className="font-heading text-lg font-semibold">To do</h2>
          <Badge variant="outline">{todos.length} waiting</Badge>
        </div>
        {todos.length ? (
          <ul className="divide-y divide-border border-t border-border">
            {todos.map((todo) => (
              <li key={todo.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">{todo.label}</p>
                <Button render={<Link href={todo.href} />} variant="outline" className="h-11">Open</Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-start gap-3 border-t border-border py-6 text-muted-foreground">
            <span className="mt-1 size-3 rounded-full bg-line-impact" aria-hidden="true" />
            <div>
              <p className="font-medium text-foreground">Nothing needs you right now</p>
              <p className="mt-1 text-sm">Confirmations, handovers and help completions will appear here.</p>
            </div>
          </div>
        )}
      </section>

      <section className="border-y border-border bg-card py-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-points-ink">Emas · BetterPoints</p>
            <p className="mt-1 font-heading text-4xl font-semibold tabular-nums">{active.points?.balance ?? 0} BP</p>
          </div>
          <Button render={<Link href="/rewards" />} variant="outline" className="h-11">Open rewards</Button>
        </div>
        <div className="mt-6 border-l-4 border-line-event pl-4">
          {(ledgerResult.data ?? []).length ? (
            <ul className="flex flex-col gap-3">
              {ledgerResult.data?.map((row) => (
                <li key={row.id} className="relative flex items-center justify-between gap-3 text-sm">
                  <span className="absolute -left-[21px] size-2.5 rounded-full border-2 border-card bg-line-event" aria-hidden="true" />
                  <span>{describeActivity(row.action_type)}</span>
                  <span className={`font-medium tabular-nums ${row.delta > 0 ? "text-points-ink" : "text-muted-foreground"}`}>{row.delta > 0 ? "+" : ""}{row.delta}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Verified activity will appear here as stops on your route.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">Nearby events</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your neighbourhood first, then the rest of the township.</p>
          </div>
          <Button render={<Link href="/events" />} variant="ghost" className="h-11">All events</Button>
        </div>
        {(eventsResult.data ?? []).length ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {eventsResult.data?.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="flex flex-col gap-2 py-4 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatEventRange(event.starts_at, event.ends_at)}</p>
                  </div>
                  <Badge variant={event.event_categories?.counts_as_sustainability ? "secondary" : "outline"}>{event.event_categories?.name ?? "Event"}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-4">
            <EmptyHeader><EmptyTitle>No events this week</EmptyTitle><EmptyDescription>Host one or browse next week.</EmptyDescription></EmptyHeader>
          </Empty>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">Items to borrow</h2>
            <p className="mt-1 text-sm text-muted-foreground">Useful things your neighbours are sharing.</p>
          </div>
          <Button render={<Link href="/borrow" />} variant="ghost" className="h-11">Browse borrow</Button>
        </div>
        {(itemsResult.data ?? []).length ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {itemsResult.data?.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <Link href={`/borrow/items/${item.id}`} className="block p-3 hover:bg-muted/30">
                  <Image src={item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"} alt={item.title} width={320} height={180} className="h-28 w-full rounded-lg object-cover" />
                  <p className="mt-3 font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.item_categories?.name ?? "Item"} · {item.condition.replace("_", " ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty className="mt-4">
            <EmptyHeader><EmptyTitle>No items nearby yet</EmptyTitle><EmptyDescription>Check back after your neighbours list something useful.</EmptyDescription></EmptyHeader>
          </Empty>
        )}
      </section>

      <section className="rounded-xl border border-border bg-muted/40 p-5">
        <p className="text-sm font-medium text-rimba-ink">Township update</p>
        <p className="mt-2 font-heading text-lg font-semibold">The next announcement will appear here.</p>
        <p className="mt-1 text-sm text-muted-foreground">Organisers and the township office can share practical updates in Phase 2.</p>
      </section>
    </div>
  )
}

function describeActivity(actionType: string): string {
  const labels: Record<string, string> = {
    event_attendance: "Joined a verified event",
    item_lent_completed: "Completed a neighbour lend",
    item_returned_on_time: "Returned a borrow on time",
    event_hosted: "Hosted a successful event",
  }
  return labels[actionType] ?? actionType.replaceAll("_", " ")
}
