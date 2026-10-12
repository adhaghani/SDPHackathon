import Link from "next/link"

import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

export default async function BorrowMinePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [borrowingResult, lendingResult, itemsResult] = await Promise.all([
    supabase.from("bookings").select("id,status,start_date,end_date,items(title)").eq("borrower_id", active.user.id).order("created_at", { ascending: false }),
    supabase.from("bookings").select("id,status,start_date,end_date,items(title)").eq("lender_id", active.user.id).order("created_at", { ascending: false }),
    supabase.from("items").select("id,title,status,condition,item_categories(name)").eq("owner_id", active.user.id).order("created_at", { ascending: false }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        eyebrow="Pinjam · Mine"
        title="Your borrowing and lending"
        actions={<Button render={<Link href="/borrow/new" />}>List an item</Button>}
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
          <BookingRows bookings={lendingResult.data ?? []} empty="No one has requested your items yet." />
        </TabsContent>
        <TabsContent value="items">
          <div className="flex flex-col gap-4">
            <ul className="divide-y divide-border border-y border-border">
              {(itemsResult.data ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-4">
                  <div>
                    <Link href={`/borrow/items/${item.id}`} className="font-medium underline-offset-4 hover:underline">{item.title}</Link>
                    <p className="mt-1 text-sm text-muted-foreground">{item.item_categories?.name ?? "Item"} · {item.condition.replace("_", " ")}</p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </li>
              ))}
              {itemsResult.data?.length === 0 ? <li className="py-6 text-sm text-muted-foreground">You have not listed an item yet.</li> : null}
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
}: {
  bookings: Array<{ id: string; status: string; start_date: string; end_date: string; items: { title: string } | null }>
  empty: string
}) {
  if (!bookings.length) return <p className="py-6 text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="divide-y divide-border border-y border-border">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/borrow/bookings/${booking.id}`} className="font-medium underline-offset-4 hover:underline">{booking.items?.title ?? "Borrowing request"}</Link>
            <p className="mt-1 text-sm text-muted-foreground">{formatEventDate(booking.start_date)} – {formatEventDate(booking.end_date)}</p>
          </div>
          <Badge variant="outline">{booking.status.replace("_", " ")}</Badge>
        </li>
      ))}
    </ul>
  )
}
