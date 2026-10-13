import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarRangeIcon, HandshakeIcon, ShieldCheckIcon, TagIcon, WalletIcon } from "lucide-react"

import { BookingRequestForm } from "@/components/borrow/booking-request-form"
import { ItemGuideForm } from "@/components/borrow/item-guide-form"
import { AvailabilityCalendar } from "@/components/borrow/availability-calendar"
import { ReportForm } from "@/components/reports/report-form"
import { DemoLabel } from "@/components/shared/demo-label"
import { MediaPoster } from "@/components/shared/media-poster"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { isDemoMode } from "@/lib/env"
import { formatEventDate, formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { trustTierLabel } from "@/lib/trust"
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
      .select("id,title,description,condition,photo_paths,deposit_rm,estimated_new_price_rm,max_loan_days,handover_options,owner_id,category_id,kind,value_source,requires_deposit,allow_deposit_waiver,min_trust_tier,duration_minutes,meeting_arrangement,guardian_acknowledgement,item_categories(name,slug,typical_new_price_rm,hourly_rate_rm)")
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
  const [ownerResult, relatedResult, guideResult, historyResult, valueResult] = await Promise.all([
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
    supabase
      .from("item_guides")
      .select("id,body,safety_note,photo_paths,updated_at")
      .eq("item_id", item.id)
      .maybeSingle(),
    supabase.rpc("get_item_history", { p_item_id: item.id }),
    supabase
      .from("bookings")
      .select("estimated_value_saved_rm")
      .eq("item_id", item.id)
      .eq("status", "completed"),
  ])
  if (historyResult.error) throw new Error(historyResult.error.message)
  const history = historyResult.data as {
    is_owner?: boolean
    borrow_count?: number
    unique_borrowers?: number
    lifetime_saved_rm?: number
    timeline?: Array<{ date?: string; type?: string; display_name?: string; condition?: string | null }>
  } | null
  if (valueResult.error) throw new Error(valueResult.error.message)
  const guide = guideResult.data
  const lifetimeSaved = (valueResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.estimated_value_saved_rm ?? 0),
    0
  )

  const photo = item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"
  const free = Number(item.deposit_rm) === 0
  const lender = ownerResult.data?.display_name ?? "a neighbour"
  const handover = item.handover_options?.length ? item.handover_options : ["Meet in a shared space"]
  const facts = [
    { icon: TagIcon, label: "Condition", value: item.condition.replace("_", " ") },
    { icon: CalendarRangeIcon, label: "Loan limit", value: `Up to ${item.max_loan_days} ${item.max_loan_days === 1 ? "day" : "days"}` },
    {
      icon: WalletIcon,
      label: "Deposit",
      value: free
        ? "None"
        : item.allow_deposit_waiver
          ? `${formatMoney(item.deposit_rm)}, arranged in person · highly trusted borrowers may be waived`
          : `${formatMoney(item.deposit_rm)}, arranged in person`,
    },
    { icon: HandshakeIcon, label: "Handover", value: handover.join(" · ") },
    {
      icon: ShieldCheckIcon,
      label: "Trust requirement",
      value: item.min_trust_tier ? `${trustTierLabel(item.min_trust_tier)} or higher` : "Any neighbour",
    },
    ...(item.kind === "skill"
      ? [
          {
            icon: CalendarRangeIcon,
            label: "Session duration",
            value: `${item.duration_minutes ?? 60} minutes`,
          },
          {
            icon: HandshakeIcon,
            label: "Meeting",
            value: item.meeting_arrangement === "shared_facility" ? "Shared township space" : "Arranged by message",
          },
        ]
      : []),
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

          <AvailabilityCalendar bookings={bookingsResult.data ?? []} maxLoanDays={item.max_loan_days} />

          <section aria-labelledby="history-heading">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="history-heading" className="text-title text-ink">Item history</h2>
              <span className="text-sm text-ink-muted">Dates show the day only</span>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              Borrowed {history?.borrow_count ?? 0} times by {history?.unique_borrowers ?? 0} neighbours ·{" "}
              <strong className="text-ink">
                ~RM {Math.round(lifetimeSaved).toLocaleString("en-MY")} saved
              </strong>{" "}
              (Estimated)
            </p>
            {history?.timeline?.length ? (
              <ol className="mt-4 space-y-3 border-l-2 border-lilac pl-4">
                {history.timeline.map((event, index) => (
                  <li key={`${event.date}-${event.type}-${index}`} className="relative text-sm">
                    <span aria-hidden="true" className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-ink bg-surface" />
                    <p className="font-bold text-ink">
                      {event.type === "listed" ? "Listed" : event.type === "guide_added" ? "How-to guide added" : event.type === "returned" ? "Returned" : "Borrowed"}
                    </p>
                    <p className="text-ink-muted">
                      {event.date} · {event.display_name}
                      {event.condition ? ` · condition: ${event.condition.replace("_", " ")}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 rounded-lg border border-hairline bg-surface p-4 text-sm text-ink-muted">
                No borrowing history yet. This item&apos;s first loan will start the timeline.
              </p>
            )}
            {(valueResult.data ?? []).length ? (
              <ul className="mt-4 space-y-2 border-t border-hairline pt-4">
                {(valueResult.data ?? []).map((row, index) => (
                  <li key={`${row.estimated_value_saved_rm}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-ink-muted">Completed borrow #{index + 1}</span>
                    <strong className="text-ink">
                      RM {Math.round(Number(row.estimated_value_saved_rm ?? 0)).toLocaleString("en-MY")} estimated value shared
                    </strong>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {item.kind === "skill" && item.guardian_acknowledgement ? (
            <p className="rounded-lg bg-mint-tint p-3 text-sm text-ink">
              Tuition listing: a guardian will be present for students under 18.
            </p>
          ) : null}

          <section aria-labelledby="guide-heading" className="bb-card p-5 sm:p-6">
            <h2 id="guide-heading" className="text-title text-ink">How to use it</h2>
            {guide ? (
              <div className="mt-3">
                <p className="max-w-[70ch] whitespace-pre-line text-ink">{guide.body}</p>
                {guide.safety_note ? (
                  <p className="mt-3 rounded-lg bg-coral-tint p-3 text-sm text-ink">
                    <strong>Safety:</strong> {guide.safety_note}
                  </p>
                ) : null}
                {guide.photo_paths?.length ? (
                  <ul className="mt-3 grid grid-cols-3 gap-2">
                    {guide.photo_paths.map((path) => (
                      <li key={path}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={path} alt="How-to guide" className="aspect-square w-full rounded-lg border border-hairline object-cover" />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {isOwner ? (
                  <div className="mt-5 border-t border-hairline pt-5">
                    <ItemGuideForm
                      itemId={item.id}
                      initialBody={guide.body}
                      initialSafetyNote={guide.safety_note}
                      initialPhotoPaths={guide.photo_paths ?? []}
                    />
                  </div>
                ) : null}
              </div>
            ) : isOwner ? (
              <div className="mt-3">
                <p className="text-sm text-ink-muted">Add short instructions before handing this item over. Your first guide earns 5 BP.</p>
                <div className="mt-4">
                  <ItemGuideForm itemId={item.id} />
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">The owner has not added a how-to guide yet.</p>
            )}
          </section>

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
