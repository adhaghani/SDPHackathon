import Image from "next/image"
import Link from "next/link"

import { requireActiveMember } from "@/lib/data"
import { formatMoney } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function BorrowPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; free?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()
  const categories = await supabase.from("item_categories").select("id,slug,name").order("name")

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

  const items = await query
  if (items.error) throw new Error(items.error.message)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-line-borrow">Pinjam · Borrow</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold">Borrow from your neighbours</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Find something useful, request it, and return it with two-sided confirmation.
          </p>
        </div>
        <Button render={<Link href="/borrow/new" />} className="h-11">
          List an item
        </Button>
      </section>

      <form className="flex flex-col gap-3 border-y border-border py-4 sm:flex-row" action="/borrow" method="get">
        <label className="sr-only" htmlFor="borrow-q">Search items</label>
        <input id="borrow-q" name="q" defaultValue={params.q ?? ""} placeholder="Search items" className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
        <label className="sr-only" htmlFor="borrow-category">Category</label>
        <select id="borrow-category" name="category" defaultValue={params.category ?? ""} className="h-10 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="">All categories</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.slug}>{category.name}</option>
          ))}
        </select>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-input px-3 text-sm">
          <input type="checkbox" name="free" value="true" defaultChecked={params.free === "true"} />
          Free to borrow
        </label>
        <Button type="submit" variant="outline" className="h-10">Filter</Button>
      </form>

      <ul className="grid gap-4 sm:grid-cols-2">
        {(items.data ?? []).map((item) => {
          const photo = item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"
          return (
            <li key={item.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <Link href={`/borrow/items/${item.id}`} className="flex flex-col gap-4 p-4 hover:bg-muted/30 sm:flex-row">
                <Image src={photo} alt={item.title} width={112} height={84} className="h-24 w-full rounded-lg object-cover sm:h-21 sm:w-28" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.item_categories?.name ?? "Item"}</Badge>
                    {item.deposit_rm === 0 ? <Badge variant="secondary">Free to borrow</Badge> : null}
                  </div>
                  <h2 className="mt-2 font-heading text-lg font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.condition.replace("_", " ")} · up to {item.max_loan_days} days</p>
                  <p className="mt-2 text-sm">{formatMoney(item.estimated_new_price_rm)} estimated new value</p>
                </div>
              </Link>
            </li>
          )
        })}
        {items.data?.length === 0 ? (
          <li className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground sm:col-span-2">
            No items match this search. List something useful for your neighbours.
          </li>
        ) : null}
      </ul>
    </div>
  )
}
