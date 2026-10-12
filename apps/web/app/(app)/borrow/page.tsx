import Link from "next/link"
import { PlusIcon, SearchIcon } from "lucide-react"

import { DemoLabel } from "@/components/shared/demo-label"
import { MediaPoster } from "@/components/shared/media-poster"
import { Pagination } from "@/components/shared/pagination"
import { requireActiveMember } from "@/lib/data"
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { isDemoMode, isFeatureEnabled } from "@/lib/env"
import { parseNaturalLanguageSearch } from "@/lib/ai-search"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export default async function BorrowPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; free?: string; nl?: string; page?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()
  const pageSize = 12
  const page = Math.max(1, Number(params.page ?? 1) || 1)
  const offset = (page - 1) * pageSize
  const categories = await supabase.from("item_categories").select("id,slug,name").order("name")
  const naturalLanguage = isFeatureEnabled("ai_search") && params.nl ? parseNaturalLanguageSearch(params.nl) : null

  let query = supabase
    .from("items")
    .select("id,title,description,condition,photo_paths,deposit_rm,estimated_new_price_rm,max_loan_days,item_categories(slug,name)", { count: "exact" })
    .eq("township_id", active.townshipId)
    .eq("status", "active")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (params.q) query = query.ilike("title", `%${params.q}%`)
  if (params.category) query = query.eq("item_categories.slug", params.category)
  if (params.free === "true") query = query.eq("deposit_rm", 0)
  if (naturalLanguage?.category) query = query.eq("item_categories.slug", naturalLanguage.category)
  if (naturalLanguage?.freeOnly) query = query.eq("deposit_rm", 0)

  const items = await query
  if (items.error) throw new Error(items.error.message)

  const current = new URLSearchParams()
  if (params.q) current.set("q", params.q)
  if (params.nl) current.set("nl", params.nl)
  if (params.free === "true") current.set("free", "true")

  const categoryOptions = categories.data ?? []

  const chipHref = (category?: string) => {
    const next = new URLSearchParams(current)
    if (category) next.set("category", category)
    else next.delete("category")
    const query = next.toString()
    return query ? `/borrow?${query}` : "/borrow"
  }
  const freeHref = params.free === "true"
    ? chipHrefWithoutFree(current, params.category)
    : (() => {
        const next = new URLSearchParams(current)
        if (params.category) next.set("category", params.category)
        next.set("free", "true")
        return `/borrow?${next.toString()}`
      })()
  const totalPages = Math.max(1, Math.ceil((items.count ?? 0) / pageSize))
  const chipClass = (active: boolean) =>
    cn(
      "inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold transition-colors duration-150 ease-out",
      active ? "bg-ink text-surface" : "bg-lilac-tint text-ink hover:bg-lilac"
    )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow text-ink-muted">Pinjam · Borrow</p>
          <h1 className="text-display-lg mt-1 text-ink">Borrow</h1>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button render={<Link href="/borrow/mine" />} variant="outline" className="max-sm:hidden">Your loans</Button>
          <Button render={<Link href="/borrow/new" />} variant="cta" size="cta">
            <PlusIcon aria-hidden="true" data-icon="inline-start" />
            List an item
          </Button>
        </div>
      </div>

      <form className="flex flex-col gap-3" action="/borrow" method="get" role="search">
        {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
        {params.free === "true" ? <input type="hidden" name="free" value="true" /> : null}
        <label className="sr-only" htmlFor="borrow-q">Search items</label>
        <div className="flex h-13 w-full items-center gap-3 rounded-lg border border-ink-muted bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
          <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" strokeWidth={1.8} />
          <input
            id="borrow-q"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Search drills, tables, tents…"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
          />
          <Button type="submit" variant="ghost" size="sm" className="shrink-0">Search</Button>
        </div>
        {isFeatureEnabled("ai_search") ? (
          <>
            <label className="text-sm font-bold text-ink" htmlFor="borrow-nl">Or describe what you need</label>
            <input
              id="borrow-nl"
              name="nl"
              defaultValue={params.nl ?? ""}
              placeholder="Something for the kids this weekend"
              className="min-h-11 w-full rounded-lg border border-ink-muted bg-surface px-4 text-base text-ink outline-none placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          </>
        ) : null}
      </form>

      <nav aria-label="Borrow filters" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link href={chipHref()} aria-current={!params.category ? "true" : undefined} className={chipClass(!params.category)}>
          All
        </Link>
        <Link href={freeHref} aria-current={params.free === "true" ? "true" : undefined} className={chipClass(params.free === "true")}>
          Free to borrow
        </Link>
        {categoryOptions.map((category) => (
          <Link
            key={category.id}
            href={chipHref(category.slug)}
            aria-current={params.category === category.slug ? "true" : undefined}
            className={chipClass(params.category === category.slug)}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-ink-muted tabular-nums">
          <Link href="/borrow/mine" className="mr-3 font-bold text-ink underline underline-offset-4 sm:hidden">Your loans</Link>
          {(items.count ?? 0).toLocaleString("en-MY")} {items.count === 1 ? "item" : "items"} near you
        </p>
        {isDemoMode() ? <DemoLabel /> : null}
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
                  className={cn("border border-hairline transition-shadow duration-150 ease-out group-hover:shadow-raised", posterTints[index % posterTints.length])}
                  badge={
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold text-ink sm:text-sm", free ? "bg-mint-tint" : "bg-surface")}>
                      {free ? "Free" : `${formatMoney(item.deposit_rm)} deposit`}
                    </span>
                  }
                  sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
                />
                <p className="mt-2 font-display text-base leading-tight font-bold text-ink sm:text-lg">{item.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {item.condition.replace("_", " ")} · up to {item.max_loan_days} {item.max_loan_days === 1 ? "day" : "days"}
                </p>
              </Link>
            </li>
          )
        })}
        {items.data?.length === 0 ? (
          <li className="bb-card col-span-full p-8 text-center">
            <p className="font-display text-lg font-bold text-ink">No items match this search.</p>
            <p className="mt-2 text-sm text-ink-muted">Try a broader search, or list something useful for your neighbours.</p>
            <Button render={<Link href="/borrow/new" />} variant="cta" size="cta" className="mt-5">List an item</Button>
          </li>
        ) : null}
      </ul>
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/borrow"
        searchParams={{ q: params.q, category: params.category, free: params.free, nl: params.nl }}
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

function chipHrefWithoutFree(current: URLSearchParams, category?: string) {
  const next = new URLSearchParams(current)
  next.delete("free")
  if (category) next.set("category", category)
  const query = next.toString()
  return query ? `/borrow?${query}` : "/borrow"
}
