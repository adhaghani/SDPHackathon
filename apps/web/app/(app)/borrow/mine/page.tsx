import Link from "next/link"

import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate } from "@/lib/format"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { trustTierLabel } from "@/lib/trust"

export default async function BorrowMinePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [borrowingResult, lendingResult, itemsResult] = await Promise.all([
    supabase.from("bookings").select("id,status,start_date,end_date,items(title)").eq("borrower_id", active.user.id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id,status,start_date,end_date,borrower_id,item_id,items(title)").eq("lender_id", active.user.id).order("created_at", { ascending: false }),
    supabase.from("items").select("id,title,status,condition,item_categories(name)").eq("owner_id", active.user.id).order("created_at", { ascending: false }),
  ])
  const requestedLending = (lendingResult.data ?? []).filter((booking) => booking.status === "requested")
  const trustResults = await Promise.all(
    requestedLending.map((booking) =>
      supabase.rpc("get_incoming_request_trust", {
        p_item_id: booking.item_id,
        p_requester_id: booking.borrower_id,
      })
    )
  )
  const lendingTrust = new Map(
    requestedLending.map((booking, index) => [booking.id, trustResults[index]?.data as { tier?: string } | null])
  )

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow="Pinjam · Mine"
        title="Borrowing and lending"
        actions={<Button render={<Link href="/borrow/new" />} variant="cta" size="cta">List an item</Button>}
      />
      <Tabs defaultValue="borrowing">
        <TabsList>
          <TabsTrigger value="borrowing">I'm borrowing</TabsTrigger>
          <TabsTrigger value="lending">I'm lending</TabsTrigger>
          <TabsTrigger value="items">My items</TabsTrigger>
        </TabsList>
        <TabsContent value="borrowing">
          <BookingRows bookings={borrowingResult.data ?? []} empty="You have no borrowing requests yet." />
        </TabsContent>
        <TabsContent value="lending">
          <BookingRows bookings={lendingResult.data ?? []} empty="No one has requested your items yet." trust={lendingTrust} />
        </TabsContent>
        <TabsContent value="items">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-lilac-tint p-4">
              <div>
                <p className="font-bold text-ink">Bundle your items</p>
                <p className="text-sm text-ink-muted">Let neighbours request several of your items together.</p>
              </div>
              <Button render={<Link href="/borrow/bundles/new" />} variant="outline">Create bundle</Button>
            </div>
            <ul className="bb-card mt-4 divide-y divide-hairline">
              {(itemsResult.data ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <div>
                    <Link href={`/borrow/items/${item.id}`} className="font-bold text-ink underline-offset-4 hover:underline">{item.title}</Link>
                    <p className="mt-1 text-sm text-muted-foreground">{item.item_categories?.name ?? "Item"} · {item.condition.replace("_", " ")}</p>
                  </div>
                  <StatusPill status={item.status} />
                </li>
              ))}
              {itemsResult.data?.length === 0 ? <li className="px-4 py-6 text-sm text-ink-muted">You have not listed an item yet.</li> : null}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BookingRows({
  bookings,
  empty,
  trust,
}: {
  bookings: Array<{ id: string; status: string; start_date: string; end_date: string; items: { title: string } | null }>
  empty: string
  trust?: Map<string, { tier?: string } | null>
}) {
  if (!bookings.length) return <p className="px-4 py-6 text-sm text-ink-muted">{empty}</p>
  return (
    <ul className="bb-card mt-4 divide-y divide-hairline">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <Link href={`/borrow/bookings/${booking.id}`} className="font-bold text-ink underline-offset-4 hover:underline">{booking.items?.title ?? "Borrowing request"}</Link>
            <p className="mt-1 text-sm text-muted-foreground">{formatEventDate(booking.start_date)} – {formatEventDate(booking.end_date)}</p>
            {trust?.get(booking.id)?.tier ? (
              <span className="mt-1 inline-block rounded-full bg-lilac-tint px-2 py-0.5 text-xs font-bold text-ink">
                {trustTierLabel(trust.get(booking.id)?.tier)} borrower
              </span>
            ) : null}
          </div>
          <StatusPill status={booking.status} />
        </li>
      ))}
    </ul>
  )
}
