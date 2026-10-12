import Image from "next/image"
import Link from "next/link"
import { PackageIcon, SearchIcon } from "lucide-react"

import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { isFeatureEnabled } from "@/lib/env"
import { parseNaturalLanguageSearch } from "@/lib/ai-search"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const imageTints = ["bg-sun-tint", "bg-mint-tint", "bg-lilac-tint", "bg-coral-tint"]
const chipTints = ["bg-sun-tint", "bg-mint-tint", "bg-lilac-tint"]

export default async function BorrowPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; free?: string; nl?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()
  const categories = await supabase.from("item_categories").select("id,slug,name").order("name")
  const naturalLanguage = isFeatureEnabled("ai_search") && params.nl ? parseNaturalLanguageSearch(params.nl) : null

  let query = supabase
    .from("items")
    .select("id,title,description,condition,photo_paths,deposit_rm,estimated_new_price_rm,max_loan_days,item_categories(slug,name)")
    .eq("township_id", active.townshipId)
    .eq("status", "active")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(40)

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
  const selectedCategory = categoryOptions.find((category) => category.slug === params.category)
  const visibleCategories = selectedCategory
    ? [selectedCategory, ...categoryOptions.filter((category) => category.id !== selectedCategory.id).slice(0, 3)]
    : categoryOptions.slice(0, 4)

  const chipHref = (category?: string) => {
    const next = new URLSearchParams(current)
    if (category) next.set("category", category)
    else next.delete("category")
    const query = next.toString()
    return query ? `/borrow?${query}` : "/borrow"
  }

  return (
    <div className="flex flex-col gap-4">
      <PageBand
        eyebrow="Pinjam · Borrow"
        title={<span aria-label="Borrow from your neighbours">What do you need today?</span>}
        description="Find something useful, request it, and return it with two-sided confirmation."
        actions={<Button render={<Link href="/borrow/new" />} variant="outline">List an item</Button>}
      >
        <form className="flex flex-col gap-3" action="/borrow" method="get">
          {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
          {params.free === "true" ? <input type="hidden" name="free" value="true" /> : null}
          <label className="sr-only" htmlFor="borrow-q">Search items</label>
          <div className="flex h-[52px] w-full items-center gap-3 rounded-lg border border-border bg-surface px-4 shadow-card focus-within:border-ring">
            <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-ink-muted" strokeWidth={1.8} />
            <input
              id="borrow-q"
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder="Search drills, tables, tents..."
              className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-muted/70"
            />
          </div>
          {isFeatureEnabled("ai_search") ? (
            <>
              <label className="sr-only" htmlFor="borrow-nl">Describe what you need</label>
              <input
                id="borrow-nl"
                name="nl"
                defaultValue={params.nl ?? ""}
                placeholder="Something for the kids this weekend"
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 text-base text-white outline-none placeholder:text-band-eyebrow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </>
          ) : null}
          <Button type="submit" variant="cta" size="cta" className="w-fit">Search items</Button>
        </form>
      </PageBand>

      <nav aria-label="Borrow filters" className="flex flex-wrap gap-2">
        <Link
          href={chipHref()}
          aria-current={!params.category ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition-colors",
            !params.category ? "bg-ink text-white" : "bg-surface text-ink hover:bg-lilac-tint"
          )}
        >
          All
        </Link>
        <Link
          href={params.free === "true" ? chipHrefWithoutFree(current) : `${chipHref()}${chipHref().includes("?") ? "&" : "?"}free=true`}
          aria-current={params.free === "true" ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition-colors",
            params.free === "true" ? "bg-ink text-white" : "bg-sun-tint text-ink hover:bg-sun-tint/80"
          )}
        >
          Free to borrow
        </Link>
        {visibleCategories.map((category, index) => (
          <Link
            key={category.id}
            href={chipHref(category.slug)}
            aria-current={params.category === category.slug ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold transition-colors",
              params.category === category.slug ? "bg-ink text-white" : `${chipTints[index % chipTints.length]} text-ink hover:opacity-80`
            )}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      <ul className="grid gap-3.5 sm:grid-cols-2">
        {(items.data ?? []).map((item, index) => {
          const photo = item.photo_paths?.[0]
          return (
            <li key={item.id} className="bb-card overflow-hidden">
              <div className={`flex h-[76px] items-center justify-center ${imageTints[index % imageTints.length]}`}>
                {photo ? (
                  <Image src={photo} alt="" width={320} height={180} className="h-full w-full object-cover" />
                ) : (
                  <PackageIcon aria-hidden="true" className="size-10 text-ink" strokeWidth={1.6} />
                )}
              </div>
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{item.item_categories?.name ?? "Item"}</Badge>
                  {item.deposit_rm === 0 ? <Badge variant="secondary">Free</Badge> : null}
                </div>
                <h2 className="mt-2 font-display text-[15px] text-ink">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.condition.replace("_", " ")} · up to {item.max_loan_days} days
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Estimated value {formatMoney(item.estimated_new_price_rm)}
                </p>
                <Button render={<Link href={`/borrow/items/${item.id}`} />} size="block" className="mt-3">
                  Ask to borrow
                </Button>
              </div>
            </li>
          )
        })}
        {items.data?.length === 0 ? (
          <li className="bb-card p-8 text-center sm:col-span-2">
            <p className="font-display text-lg text-ink">No items match this search.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try a broader search, or list something useful for your neighbours.</p>
            <Button render={<Link href="/borrow/new" />} variant="cta" size="cta" className="mt-5">List an item</Button>
          </li>
        ) : null}
      </ul>
    </div>
  )
}

function chipHrefWithoutFree(current: URLSearchParams) {
  const next = new URLSearchParams(current)
  next.delete("free")
  const query = next.toString()
  return query ? `/borrow?${query}` : "/borrow"
}
