import Link from "next/link"

import {
  SavedItemCard,
  type SavedItemCardItem,
} from "@/components/borrow/saved-item-card"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { getSavedItemIds } from "@/lib/saved-items"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export default async function SavedItemsPage() {
  const active = await requireActiveMember()
  const savedItemIds = await getSavedItemIds(active.user.id)
  const supabase = await createClient()

  const savedItemsResult = savedItemIds.length
    ? await supabase
        .from("items")
        .select(
          "id,title,photo_paths,deposit_rm,max_loan_days,kind,duration_minutes,condition,item_categories(name,slug)"
        )
        .eq("township_id", active.townshipId)
        .eq("status", "active")
        .eq("hidden", false)
        .in("id", savedItemIds)
    : { data: [] as SavedItemCardItem[], error: null }

  if (savedItemsResult.error) throw new Error(savedItemsResult.error.message)

  const itemsById = new Map(
    (savedItemsResult.data ?? []).map((item) => [item.id, item])
  )
  const items = savedItemIds
    .map((id) => itemsById.get(id))
    .filter((item): item is SavedItemCardItem => Boolean(item))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <PageBand
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow="PINJAM · Saved"
        title="Saved items"
        description="Keep a shortlist of useful things you want to find again quickly."
        actions={
          <Button render={<Link href="/borrow" />} variant="outline">
            Browse all items
          </Button>
        }
      />

      <div className="flex items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-ink-muted tabular-nums">
          {items.length} saved {items.length === 1 ? "item" : "items"}
        </p>
        <Link
          href="/borrow"
          className="text-sm font-bold underline underline-offset-4"
        >
          Find more nearby
        </Link>
      </div>

      {items.length ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item, index) => (
            <SavedItemCard key={item.id} item={item} index={index} />
          ))}
        </ul>
      ) : (
        <Empty className="bb-card">
          <EmptyHeader>
            <EmptyTitle>Nothing saved yet</EmptyTitle>
            <EmptyDescription>
              Save an item from its detail page and it will appear here for
              later.
            </EmptyDescription>
          </EmptyHeader>
          <Button render={<Link href="/borrow" />} variant="cta">
            Browse items
          </Button>
        </Empty>
      )}
    </div>
  )
}
