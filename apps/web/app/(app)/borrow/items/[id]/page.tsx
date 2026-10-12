import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { BookingRequestForm } from "@/components/borrow/booking-request-form"
import { PageBand } from "@/components/shared/page-band"
import { ReportForm } from "@/components/reports/report-form"
import { requireActiveMember } from "@/lib/data"
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const [itemResult, bookingsResult, ownerResult] = await Promise.all([
    supabase
      .from("items")
      .select("id,title,description,condition,photo_paths,deposit_rm,estimated_new_price_rm,max_loan_days,handover_options,owner_id,item_categories(name,slug)")
      .eq("id", id)
      .eq("township_id", active.townshipId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("start_date,end_date,status")
      .eq("item_id", id)
      .in("status", ["approved", "handed_over"])
      .order("start_date"),
    supabase.from("profiles").select("display_name").eq("id", active.user.id).maybeSingle(),
  ])
  if (!itemResult.data) notFound()
  const item = itemResult.data
  const photo = item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"
  const isOwner = item.owner_id === active.user.id

  return (
    <div className="mx-auto max-w-4xl">
      <PageBand
        eyebrow={item.item_categories?.name ?? "Item"}
        title={item.title}
        description={`${item.condition.replace("_", " ")} · up to ${item.max_loan_days} days`}
        actions={<Button render={<Link href="/borrow" />} variant="outline">Back to borrow</Button>}
      />
      <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="bb-card overflow-hidden">
            <Image src={photo} alt={item.title} width={800} height={500} className="h-64 w-full object-cover sm:h-80" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{item.item_categories?.name ?? "Item"}</Badge>
            <Badge variant="secondary">{item.condition.replace("_", " ")}</Badge>
            {item.deposit_rm === 0 ? <Badge variant="secondary">Free to borrow</Badge> : null}
          </div>
          <p className="mt-4 max-w-2xl leading-7">{item.description}</p>
          <div className="mt-7 border-y border-border py-5">
            <h2 className="font-display text-lg">Availability</h2>
            {bookingsResult.data?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {bookingsResult.data.map((booking) => (
                  <li key={`${booking.start_date}-${booking.end_date}`}>Booked {booking.start_date} to {booking.end_date}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No active bookings. Dates are available.</p>
            )}
          </div>
        </div>
        <aside className="bb-card p-5">
          <p className="text-sm text-muted-foreground">Estimated new value</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{formatMoney(item.estimated_new_price_rm)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Useful signal, not a promise of savings.</p>
          <div className="mt-5 border-t border-border pt-5">
            {isOwner ? (
              <p className="text-sm text-muted-foreground">This is your listing.</p>
            ) : (
              <BookingRequestForm itemId={item.id} handoverOptions={item.handover_options ?? ["Meet in a shared space"]} maxLoanDays={item.max_loan_days} />
            )}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Lender: {ownerResult.data?.display_name ?? "Neighbour"} · Meet in shared spaces and never share bank or ID details.
          </p>
          <ReportForm townshipId={active.townshipId} targetType="item" targetId={item.id} />
        </aside>
      </div>
    </div>
  )
}
