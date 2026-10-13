import Link from "next/link"

import { FeedCard } from "@/components/block/feed-card"
import type { SavedItemCardItem } from "@/components/borrow/saved-item-card"
import { formatMoney } from "@/lib/format"

export function SavedItemsSection({ items }: { items: SavedItemCardItem[] }) {
  if (!items.length) return null

  return (
    <section
      aria-labelledby="saved-items-heading"
      className="mt-8 border-t border-hairline pt-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="saved-items-heading" className="text-h2">
          Saved for later
        </h2>
        <Link
          href="/borrow/saved"
          className="text-sm font-bold underline underline-offset-4"
        >
          View all saved
        </Link>
      </div>

      <ul className="mt-3.5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 3).map((item) => {
          const free = Number(item.deposit_rm) === 0
          const category = item.item_categories?.name ?? "Item"
          const price =
            item.kind === "skill"
              ? `${item.duration_minutes ?? 60} min session`
              : free
                ? "free to borrow"
                : `${formatMoney(item.deposit_rm)} deposit`

          return (
            <li key={item.id}>
              <FeedCard
                variant="item"
                href={`/borrow/items/${item.id}`}
                title={item.title}
                meta={`${category} · ${price}`}
                image={item.photo_paths?.[0]}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
