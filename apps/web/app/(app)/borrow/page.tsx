import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { BorrowSearchForm } from "@/components/borrow/borrow-search-form"
import { ForecastNudge } from "@/components/borrow/forecast-nudge"
import { PageBand } from "@/components/shared/page-band"
import { MediaPoster } from "@/components/shared/media-poster"
import { Pagination } from "@/components/shared/pagination"
import { BorrowFilterDialog } from "@/components/shared/filter-dialog"
import { requireActiveMember } from "@/lib/data"
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/env"
import { parseNaturalLanguageSearch } from "@/lib/ai-search"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export default async function BorrowPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; free?: string; nl?: string; kind?: string; page?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()
  const pageSize = 12
  const page = Math.max(1, Number(params.page ?? 1) || 1)
  const offset = (page - 1) * pageSize
  const categories = await supabase.from("item_categories").select("id,slug,name,kind").order("name")
  const bundlesResult = await supabase
    .from("bundles")
    .select("id,title,description,cover_path,bundle_items(count)")
    .eq("township_id", active.townshipId)
    .eq("is_demo", false)
    .order("title")
    .limit(4)
  if (bundlesResult.error) throw new Error(bundlesResult.error.message)
  const naturalLanguage = isFeatureEnabled("ai_search") && params.nl ? parseNaturalLanguageSearch(params.nl) : null

  let query = supabase
    .from("items")
    .select("id,title,description,condition,kind,duration_minutes,photo_paths,deposit_rm,estimated_new_price_rm,max_loan_days,item_categories(slug,name)", { count: "exact" })
    .eq("township_id", active.townshipId)
    .eq("status", "active")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.q) query = query.ilike("title", `%${params.q}%`)
  if (params.kind === "skill" || params.kind === "item") query = query.eq("kind", params.kind)
  if (params.category) query = query.eq("item_categories.slug", params.category)
  if (params.free === "true") query = query.eq("deposit_rm", 0)
  if (naturalLanguage?.category) query = query.eq("item_categories.slug", naturalLanguage.category)
  if (naturalLanguage?.freeOnly) query = query.eq("deposit_rm", 0)

  const items = await query
  if (items.error) throw new Error(items.error.message)

  const totalPages = Math.max(1, Math.ceil((items.count ?? 0) / pageSize))

  return (
    <div className="flex flex-col gap-5">
      <ForecastNudge />
      <PageBand
        eyebrow="PINJAM · Borrow"
        title="Borrow"
        description="Find useful things shared by neighbours, then arrange a handover in a public shared space."
        actions={
          <>
            <Button render={<Link href="/borrow/mine" />} variant="outline" className="max-sm:hidden">Your loans</Button>
            <Button render={<Link href="/borrow/new" />} variant="cta" size="cta">
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              List an item
            </Button>
          </>
        }
      />

      <BorrowSearchForm
        query={params.q ?? ""}
        category={params.category}
        free={params.free === "true"}
        kind={params.kind}
        naturalLanguage={params.nl}
        showNaturalLanguage={isFeatureEnabled("ai_search")}
        filters={
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            <BorrowFilterDialog
              categories={categories.data ?? []}
              activeCategory={params.category}
              activeKind={params.kind}
              freeOnly={params.free === "true"}
              query={params.q}
              naturalLanguage={params.nl}
            />
            <Link
              href="/borrow/saved"
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-ink underline underline-offset-4"
            >
              Saved
            </Link>
            <Link
              href="/borrow/requests"
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-ink underline underline-offset-4"
            >
              Requests
            </Link>
          </div>
        }
      />

      {!params.kind || params.kind === "item" ? (
        <section aria-labelledby="bundles-heading" className={bundlesResult.data?.length ? "" : "hidden"}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="bundles-heading" className="text-title text-ink">Bundles</h2>
            <span className="text-sm text-ink-muted">Book several items together</span>
          </div>
          {bundlesResult.data?.length ? (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {bundlesResult.data.map((bundle) => (
                <li key={bundle.id}>
                  <Link href={`/borrow/bundles/${bundle.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface p-4 transition-shadow duration-150 ease-out">
                    <span className="min-w-0">
                      <span className="block font-bold text-ink">{bundle.title}</span>
                      <span className="block truncate text-sm text-ink-muted">{bundle.description}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-lilac-tint px-3 py-1 text-xs font-bold text-ink tabular-nums">
                      {bundle.bundle_items?.[0]?.count ?? 0} items
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-ink-muted tabular-nums">
          <Link href="/borrow/mine" className="mr-3 font-bold text-ink underline underline-offset-4 sm:hidden">Your loans</Link>
          {(items.count ?? 0).toLocaleString("en-MY")} {items.count === 1 ? "item" : "items"} near you
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4">
        {(items.data ?? []).map((item, index) => {
          const free = Number(item.deposit_rm) === 0
          return (
            <li key={item.id} className="min-w-0">
              <Link href={`/borrow/items/${item.id}`} className="group block rounded-lg">
                <MediaPoster
                  src={item.photo_paths?.[0] ?? demoImageFor(item.item_categories?.slug)}
                  alt=""
                  className={cn("border border-hairline transition-shadow duration-150 ease-out", posterTints[index % posterTints.length])}
                  badge={
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold text-ink sm:text-sm", free ? "bg-mint-tint" : "bg-surface")}>
                      {item.kind === "skill" ? "Skill session" : free ? "Free" : `${formatMoney(item.deposit_rm)} deposit`}
                    </span>
                  }
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
                />
                <p className="mt-2 font-display text-base leading-tight font-bold text-ink sm:text-lg">{item.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {item.kind === "skill"
                    ? `${item.duration_minutes ?? 60} min skill session`
                    : `${item.condition.replace("_", " ")} · up to ${item.max_loan_days} ${item.max_loan_days === 1 ? "day" : "days"}`}
                </p>
              </Link>
            </li>
          )
        })}
        {items.data?.length === 0 ? (
          <li className="bb-card col-span-full p-8 text-center">
            <p className="font-display text-lg font-bold text-ink">No items match this search.</p>
            <p className="mt-2 text-sm text-ink-muted">
              Try a broader search,{" "}
              <Link href={`/borrow/requests?prefill=${encodeURIComponent(params.q ?? "")}`} className="font-bold underline underline-offset-4">post a request for this</Link>
              , or list something useful for your neighbours.
            </p>
            <Button render={<Link href="/borrow/new" />} variant="cta" size="cta" className="mt-5">List an item</Button>
          </li>
        ) : null}
      </ul>
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/borrow"
        searchParams={{ q: params.q, category: params.category, free: params.free, nl: params.nl, kind: params.kind }}
      />
    </div>
  )
}

const posterTints = ["bg-sun-tint", "bg-lilac-tint", "bg-mint-tint", "bg-coral-tint"]

const demoImages: Record<string, string> = {
  "home-tools": "/demo/item-drill.svg",
  cleaning: "/demo/item-pressure-washer.svg",
  events: "/demo/item-projector.svg",
  sports: "/demo/item-badminton.svg",
  kids: "/demo/item-board-games.svg",
  kitchen: "/demo/item-cooler.svg",
}

function demoImageFor(slug?: string | null) {
  return (slug && demoImages[slug]) || "/demo/item-placeholder.svg"
}
