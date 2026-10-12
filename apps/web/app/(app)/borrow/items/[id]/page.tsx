import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarRangeIcon, HandshakeIcon, ShieldCheckIcon, TagIcon, WalletIcon } from "lucide-react"

import { BookingRequestForm } from "@/components/borrow/booking-request-form"
import { ReportForm } from "@/components/reports/report-form"
import { DemoLabel } from "@/components/shared/demo-label"
import { MediaPoster } from "@/components/shared/media-poster"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { isDemoMode } from "@/lib/env"
import { formatEventDate, formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@workspace/ui/lib/utils"

const shortDate = (value: string) => formatEventDate(value).replace(/ \d{4}$/, "")

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const [itemResult, bookingsResult] = await Promise.all([
    supabase
      .from("items")
      .select("id,title,description,condition,photo_paths,deposit_rm,estimated_new_price_rm,max_loan_days,handover_options,owner_id,category_id,item_categories(name,slug)")
      .eq("id", id)
      .eq("township_id", active.townshipId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("start_date,end_date,status")
      .eq("item_id", id)
      .in("status", ["approved", "handed_over"])
      .order("start_date"),
  ])
  if (!itemResult.data) notFound()
  const item = itemResult.data
  const isOwner = item.owner_id === active.user.id
  const [ownerResult, relatedResult] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", item.owner_id).maybeSingle(),
    supabase
      .from("items")
      .select("id,title,photo_paths,deposit_rm,max_loan_days")
      .eq("township_id", active.townshipId)
      .eq("category_id", item.category_id)
      .eq("status", "active")
      .eq("hidden", false)
      .neq("id", item.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ])

  const photo = item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"
  const free = Number(item.deposit_rm) === 0
  const lender = ownerResult.data?.display_name ?? "a neighbour"
  const handover = item.handover_options?.length ? item.handover_options : ["Meet in a shared space"]
  const facts = [
    { icon: TagIcon, label: "Condition", value: item.condition.replace("_", " ") },
    { icon: CalendarRangeIcon, label: "Loan limit", value: `Up to ${item.max_loan_days} ${item.max_loan_days === 1 ? "day" : "days"}` },
    { icon: WalletIcon, label: "Deposit", value: free ? "None" : `${formatMoney(item.deposit_rm)}, arranged in person` },
    { icon: HandshakeIcon, label: "Handover", value: handover.join(" · ") },
  ]
  const related = relatedResult.data ?? []

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageBand
        className="mb-5 lg:hidden"
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow={`Pinjam · ${item.item_categories?.name ?? "Item"}`}
        title={item.title}
      />

      <div className="grid gap-7 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-12">
        <div className="md:sticky md:top-24 md:self-start">
          <MediaPoster
            src={photo}
            alt={item.title}
            priority
            className="border border-hairline bg-sun-tint"
            badge={
              <span className={cn("rounded-full px-2.5 py-1 text-sm font-bold text-ink", free ? "bg-mint-tint" : "bg-surface")}>
                {free ? "Free to borrow" : `${formatMoney(item.deposit_rm)} deposit`}
              </span>
            }
            sizes="(min-width: 1024px) 26rem, (min-width: 768px) 18rem, 100vw"
          />
          <p className="mt-3 text-sm text-ink-muted">
            Estimated new value {formatMoney(item.estimated_new_price_rm)}. A useful signal, not a promise of savings.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-7">
          <div className="max-lg:hidden">
            <PageBand
              className="mb-0"
              back={{ href: "/borrow", label: "Borrow" }}
              eyebrow={`Pinjam · ${item.item_categories?.name ?? "Item"}`}
              title={item.title}
              actions={isDemoMode() ? <DemoLabel /> : undefined}
            />
            <p className="mt-2 text-ink-muted">Lent by <strong className="text-ink">{lender}</strong></p>
          </div>

          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-lilac-tint">
                  <Icon className="size-5 text-ink" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <dt className="text-sm text-ink-muted">{label}</dt>
                  <dd className="font-bold text-ink first-letter:uppercase">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <section aria-labelledby="request-heading" className="bb-card p-5 sm:p-6">
            {isOwner ? (
              <>
                <h2 id="request-heading" className="text-title text-ink">This is your listing</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Requests appear in <Link href="/borrow/mine" className="font-bold text-ink underline underline-offset-4">borrowing and lending</Link>.
                </p>
              </>
            ) : (
              <>
                <h2 id="request-heading" className="text-title text-ink">Request to borrow</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  You both confirm the handover and the return. BetterPoints are given once both sides confirm.
                </p>
                <div className="mt-4">
                  <BookingRequestForm itemId={item.id} handoverOptions={handover} maxLoanDays={item.max_loan_days} />
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="availability-heading">
            <h2 id="availability-heading" className="text-title text-ink">Availability</h2>
            {bookingsResult.data?.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {bookingsResult.data.map((booking) => (
                  <li key={`${booking.start_date}-${booking.end_date}`} className="rounded-full bg-coral-tint px-3 py-1 text-sm font-bold text-ink tabular-nums">
                    Booked {shortDate(booking.start_date)} – {shortDate(booking.end_date)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 inline-flex rounded-full bg-mint-tint px-3 py-1 text-sm font-bold text-ink">No bookings yet · all dates open</p>
            )}
          </section>

          {item.description ? (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-title text-ink">About this item</h2>
              <p className="mt-2 max-w-[68ch] text-[17px] leading-7 whitespace-pre-line text-ink">{item.description}</p>
            </section>
          ) : null}

          <div className="flex flex-wrap items-start gap-3 rounded-lg bg-mint-tint p-4 text-sm text-ink">
            <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="min-w-0 flex-1">
              <strong>Borrow safely.</strong> Meet in shared spaces like the lobby or Dewan Komuniti. Never share bank or ID details.
            </p>
          </div>
          {!isOwner ? <ReportForm townshipId={active.townshipId} targetType="item" targetId={item.id} /> : null}
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="related-heading" className="mt-12 border-t border-hairline pt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="related-heading" className="text-heading text-ink">More {item.item_categories?.name?.toLowerCase() ?? "items"} to borrow</h2>
            <Link
              href={item.item_categories?.slug ? `/borrow?category=${item.item_categories.slug}` : "/borrow"}
              className="text-sm font-bold text-ink underline underline-offset-4"
            >
              See all
            </Link>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((other) => (
              <li key={other.id} className="min-w-0">
                <Link href={`/borrow/items/${other.id}`} className="group block rounded-lg">
                  <MediaPoster
                    src={other.photo_paths?.[0] ?? "/demo/item-placeholder.svg"}
                    alt=""
                    className="border border-hairline bg-lilac-tint transition-shadow duration-150 ease-out group-hover:shadow-raised"
                    sizes="(min-width: 768px) 20vw, 50vw"
                  />
                  <p className="mt-2 font-display font-bold text-ink">{other.title}</p>
                  <p className="text-sm text-ink-muted">
                    {Number(other.deposit_rm) === 0 ? "Free" : `${formatMoney(other.deposit_rm)} deposit`} · up to {other.max_loan_days} days
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
