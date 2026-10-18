import Link from "next/link"

import { Pagination } from "@/components/shared/pagination"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { formatEventDate } from "@/lib/format"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@workspace/ui/components/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { trustTierLabel } from "@/lib/trust"

export default async function BorrowMinePage({
  searchParams,
}: {
  searchParams: Promise<{
    borrowingPage?: string
    lendingPage?: string
    itemsPage?: string
    tab?: string
  }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const pageSize = 20
  const parsePage = (value?: string) => {
    const page = Number(value)
    return Number.isSafeInteger(page) && page > 0 ? page : 1
  }
  const borrowingPage = parsePage(params.borrowingPage)
  const lendingPage = parsePage(params.lendingPage)
  const itemsPage = parsePage(params.itemsPage)
  const supabase = await createClient()
  const [borrowingResult, lendingResult, itemsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,status,start_date,end_date,items(title)", { count: "exact" })
      .eq("borrower_id", active.user.id)
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false })
      .order("id")
      .range((borrowingPage - 1) * pageSize, borrowingPage * pageSize - 1),
    supabase
      .from("bookings")
      .select(
        "id,status,start_date,end_date,borrower_id,item_id,items(title)",
        { count: "exact" }
      )
      .eq("lender_id", active.user.id)
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false })
      .order("id")
      .range((lendingPage - 1) * pageSize, lendingPage * pageSize - 1),
    supabase
      .from("items")
      .select("id,title,status,condition,item_categories(name)", {
        count: "exact",
      })
      .eq("owner_id", active.user.id)
      .eq("township_id", active.townshipId)
      .order("created_at", { ascending: false })
      .order("id")
      .range((itemsPage - 1) * pageSize, itemsPage * pageSize - 1),
  ])
  const error =
    borrowingResult.error ?? lendingResult.error ?? itemsResult.error
  if (error) throw new Error(error.message)
  const requestedLending = (lendingResult.data ?? []).filter(
    (booking) => booking.status === "requested"
  )
  const trustResult = requestedLending.length
    ? await supabase.rpc("get_my_incoming_request_trust", {
        p_booking_ids: requestedLending.map((booking) => booking.id),
      })
    : null
  const lendingTrust = new Map(
    (trustResult?.data ?? []).map((row) => [row.booking_id, { tier: row.tier }])
  )
  const tab = ["borrowing", "lending", "items"].includes(params.tab ?? "")
    ? params.tab
    : "borrowing"

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow="Pinjam · Mine"
        title="Borrowing and lending"
        actions={
          <Button render={<Link href="/borrow/new" />} variant="cta" size="cta">
            List an item
          </Button>
        }
      />
      <Tabs
        key={`${tab}-${borrowingPage}-${lendingPage}-${itemsPage}`}
        defaultValue={tab}
      >
        <TabsList>
          <TabsTrigger value="borrowing">I'm borrowing</TabsTrigger>
          <TabsTrigger value="lending">I'm lending</TabsTrigger>
          <TabsTrigger value="items">My items</TabsTrigger>
        </TabsList>
        <TabsContent value="borrowing">
          <BookingRows
            bookings={borrowingResult.data ?? []}
            empty="You have no borrowing requests yet."
          />
          <Pagination
            page={borrowingPage}
            totalPages={Math.max(
              1,
              Math.ceil((borrowingResult.count ?? 0) / pageSize)
            )}
            basePath="/borrow/mine"
            pageParam="borrowingPage"
            searchParams={{ ...params, tab: "borrowing" }}
          />
        </TabsContent>
        <TabsContent value="lending">
          <BookingRows
            bookings={lendingResult.data ?? []}
            empty="No one has requested your items yet."
            trust={lendingTrust}
          />
          <Pagination
            page={lendingPage}
            totalPages={Math.max(
              1,
              Math.ceil((lendingResult.count ?? 0) / pageSize)
            )}
            basePath="/borrow/mine"
            pageParam="lendingPage"
            searchParams={{ ...params, tab: "lending" }}
          />
        </TabsContent>
        <TabsContent value="items">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-lilac-tint p-4">
              <div>
                <p className="font-bold text-ink">Bundle your items</p>
                <p className="text-sm text-ink-muted">
                  Let neighbours request several of your items together.
                </p>
              </div>
              <Button
                render={<Link href="/borrow/bundles/new" />}
                variant="outline"
              >
                Create bundle
              </Button>
            </div>
            <ul className="bb-card mt-4 divide-y divide-hairline">
              {(itemsResult.data ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div>
                    <Link
                      href={`/borrow/items/${item.id}`}
                      className="font-bold text-ink underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.item_categories?.name ?? "Item"} ·{" "}
                      {item.condition.replace("_", " ")}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </li>
              ))}
              {itemsResult.data?.length === 0 ? (
                <li className="px-4 py-6 text-sm text-ink-muted">
                  You have not listed an item yet.
                </li>
              ) : null}
            </ul>
            <Pagination
              page={itemsPage}
              totalPages={Math.max(
                1,
                Math.ceil((itemsResult.count ?? 0) / pageSize)
              )}
              basePath="/borrow/mine"
              pageParam="itemsPage"
              searchParams={{ ...params, tab: "items" }}
            />
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
  bookings: Array<{
    id: string
    status: string
    start_date: string
    end_date: string
    items: { title: string } | null
  }>
  empty: string
  trust?: Map<string, { tier?: string } | null>
}) {
  if (!bookings.length)
    return <p className="px-4 py-6 text-sm text-ink-muted">{empty}</p>
  return (
    <ul className="bb-card mt-4 divide-y divide-hairline">
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className="flex items-center justify-between gap-3 px-4 py-3.5"
        >
          <div className="min-w-0">
            <Link
              href={`/borrow/bookings/${booking.id}`}
              className="font-bold text-ink underline-offset-4 hover:underline"
            >
              {booking.items?.title ?? "Borrowing request"}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatEventDate(booking.start_date)} –{" "}
              {formatEventDate(booking.end_date)}
            </p>
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
