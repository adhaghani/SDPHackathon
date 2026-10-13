import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarRangeIcon, ChevronLeftIcon, HandshakeIcon, ShieldCheckIcon, TagIcon, WalletIcon } from "lucide-react"

import { HandoverSpot } from "@/components/block/handover-spot"
import { HandoverSteps } from "@/components/block/handover-steps"
import { ItemBookingFlow } from "@/components/block/item-booking-flow"
import { SaveItemButton } from "@/components/block/save-item-button"
import { ItemGuideForm } from "@/components/borrow/item-guide-form"
import { ReportForm } from "@/components/reports/report-form"
import { MediaPoster } from "@/components/shared/media-poster"
import { requireActiveMember } from "@/lib/data"
import { getSavedItemIds } from "@/lib/saved-items"
import { isDemoMode } from "@/lib/env"
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { trustTierLabel } from "@/lib/trust"

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const active = await requireActiveMember()
  const { id } = await params
  const savedItemIds = await getSavedItemIds(active.user.id)
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

  const [ownerResult, relatedResult, guideResult, historyResult, valueResult, lenderHistoryResult] = await Promise.all([
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
    supabase
      .from("bookings")
      .select("id,lender_return_confirmed_at,borrower_return_marked_at")
      .eq("lender_id", item.owner_id)
      .eq("status", "completed"),
  ])
  if (historyResult.error) throw new Error(historyResult.error.message)
  if (valueResult.error) throw new Error(valueResult.error.message)

  const guide = guideResult.data
  const photo = item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"
  const free = Number(item.deposit_rm) === 0
  const lender = ownerResult.data?.display_name ?? "A neighbour"
  const handoverPlace = item.handover_options?.[0] ?? "a shared township space"
  const lenderCompleted = lenderHistoryResult.data ?? []
  const allConfirmed = lenderCompleted.filter((booking) => booking.lender_return_confirmed_at && booking.borrower_return_marked_at).length
  const trustLine = lenderCompleted.length
    ? `Lent ${lenderCompleted.length} ${lenderCompleted.length === 1 ? "time" : "times"} · ${allConfirmed} returns confirmed by both`
    : "New lender · shared-space handover"

  const facts = [
    { icon: TagIcon, label: "Condition", value: item.condition.replaceAll("_", " ") },
    { icon: CalendarRangeIcon, label: "Loan limit", value: `Up to ${item.max_loan_days} ${item.max_loan_days === 1 ? "day" : "days"}` },
    {
      icon: WalletIcon,
      label: "Deposit",
      value: free ? "None" : `${formatMoney(item.deposit_rm)}, arranged in person`,
    },
    { icon: HandshakeIcon, label: "Handover", value: handoverPlace },
    {
      icon: ShieldCheckIcon,
      label: "Trust requirement",
      value: item.min_trust_tier ? `${trustTierLabel(item.min_trust_tier)} or higher` : "Any neighbour",
    },
    ...(item.kind === "skill"
      ? [{ icon: CalendarRangeIcon, label: "Session duration", value: `${item.duration_minutes ?? 60} minutes` }]
      : []),
  ]
  const related = relatedResult.data ?? []

  return (
    <div className="-mx-4 overflow-hidden rounded-none bg-sky text-ink sm:-mx-6 md:mx-0 md:rounded-[32px]">
      <div className="relative h-[270px]">
        <div className="absolute top-4 left-4 z-10">
          <Link
            href="/borrow"
            aria-label="Back"
            className="grid size-11 place-items-center rounded-full bg-white text-ink"
          >
            <ChevronLeftIcon aria-hidden="true" className="size-[22px]" strokeWidth={2.25} />
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <SaveItemButton itemId={item.id} initiallySaved={savedItemIds.includes(item.id)} />
        </div>
        <Image
          src={photo}
          alt={item.title}
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain p-12 mix-blend-multiply"
        />
      </div>

      <section className="relative -mt-6 min-h-[600px] rounded-t-[32px] bg-white px-5 pt-6 pb-10 text-ink sm:px-7 md:px-10">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit rounded-[6px] bg-sky px-2 py-0.5 text-[11px] leading-4 font-bold tracking-[0.06em] uppercase">
            PINJAM · {item.item_categories?.name ?? item.kind}
          </span>
          <h1 className="text-h1 text-balance">{item.title}</h1>
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-mustard text-sm font-bold">{lender.slice(0, 1).toUpperCase()}</span>
            <div>
              <div className="text-[15px] leading-5 font-bold">{lender} · {active.membership.townships?.name ?? "Township"}</div>
              <div className="text-[13px] leading-[18px] text-ink-soft">{trustLine}</div>
            </div>
          </div>
        </div>

        <div className="mt-[22px]">
          <ItemBookingFlow
            itemId={item.id}
            handoverOptions={item.handover_options?.length ? item.handover_options : ["Meet in a shared space"]}
            maxLoanDays={item.max_loan_days}
            bookings={bookingsResult.data ?? []}
            isOwner={isOwner}
          />
        </div>

        <div className="mt-[22px]">
          <HandoverSpot place={handoverPlace} walkingTime="2 min walk" />
        </div>

        <section className="mt-[22px]">
          <h2 className="text-[15px] leading-5 font-bold">How it works</h2>
          <div className="mt-3">
            <HandoverSteps currentStep={0} />
          </div>
        </section>


        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-12">
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="text-h2">Good to know</h2>
              <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-paper">
                      <Icon className="size-5 text-ink" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-sm text-ink-soft">{label}</dt>
                      <dd className="font-bold first-letter:uppercase">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <div className="rounded-[20px] bg-lime p-4 text-sm text-ink">
              <ShieldCheckIcon aria-hidden="true" className="mb-2 size-5" />
              <strong>Borrow safely.</strong> Meet in shared spaces like the lobby or Dewan Komuniti. Never share bank or ID details.
            </div>
          </div>

          <section aria-labelledby="guide-heading" className="rounded-[20px] bg-white p-5 sm:p-6">
            <h2 id="guide-heading" className="text-h2">How to use it</h2>
            <p className="mt-3 max-w-[70ch] whitespace-pre-line text-[15px] leading-[22px]">{item.description}</p>
            {guide ? (
              <div className="mt-5 border-t border-hairline pt-5">
                <p className="whitespace-pre-line">{guide.body}</p>
                {guide.safety_note ? (
                  <p className="mt-3 rounded-[16px] bg-tomato p-3 text-sm">
                    <strong>Safety:</strong> {guide.safety_note}
                  </p>
                ) : null}
              </div>
            ) : isOwner ? (
              <div className="mt-5 border-t border-hairline pt-5">
                <p className="text-sm text-ink-soft">Add short instructions before handing this item over.</p>
                <div className="mt-4"><ItemGuideForm itemId={item.id} /></div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-soft">The owner has not added a how-to guide yet.</p>
            )}
          </section>
        </div>

        {!isOwner ? (
          <div className="mt-8">
            <ReportForm townshipId={active.townshipId} targetType="item" targetId={item.id} />
          </div>
        ) : null}

        {related.length ? (
          <section aria-labelledby="related-heading" className="mt-12 border-t border-hairline pt-8">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="related-heading" className="text-h2">More to borrow nearby</h2>
              <Link href="/borrow" className="text-sm font-bold underline underline-offset-4">See all</Link>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {related.map((other) => (
                <li key={other.id}>
                  <Link href={`/borrow/items/${other.id}`} className="block rounded-[18px]">
                    <MediaPoster src={other.photo_paths?.[0] ?? "/demo/item-placeholder.svg"} alt="" className="bg-sky" sizes="(min-width: 768px) 20vw, 50vw" />
                    <p className="mt-2 font-bold">{other.title}</p>
                    <p className="text-sm text-ink-soft">{Number(other.deposit_rm) === 0 ? "Free" : `${formatMoney(other.deposit_rm)} deposit`}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </div>
  )
}
