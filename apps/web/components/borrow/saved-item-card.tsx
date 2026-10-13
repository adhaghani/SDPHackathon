import Link from "next/link"

import { SaveItemButton } from "@/components/block/save-item-button"
import { MediaPoster } from "@/components/shared/media-poster"
import { formatMoney } from "@/lib/format"
import { cn } from "@workspace/ui/lib/utils"

export type SavedItemCardItem = {
  id: string
  title: string
  photo_paths?: string[] | null
  deposit_rm: number
  max_loan_days: number
  kind: string
  duration_minutes?: number | null
  condition?: string | null
  item_categories?: {
    name: string
    slug: string
  } | null
}

const posterTints = [
  "bg-sun-tint",
  "bg-lilac-tint",
  "bg-mint-tint",
  "bg-coral-tint",
]

export function SavedItemCard({
  item,
  index = 0,
}: {
  item: SavedItemCardItem
  index?: number
}) {
  const free = Number(item.deposit_rm) === 0
  const detail =
    item.kind === "skill"
      ? `${item.duration_minutes ?? 60} min skill session`
      : `${item.condition?.replaceAll("_", " ") ?? "Good condition"} · up to ${item.max_loan_days} ${item.max_loan_days === 1 ? "day" : "days"}`

  return (
    <li className="min-w-0">
      <div className="relative">
        <Link
          href={`/borrow/items/${item.id}`}
          className="group block rounded-lg"
        >
          <MediaPoster
            src={item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"}
            alt=""
            className={cn(
              "border border-hairline transition-shadow duration-150 ease-out group-hover:shadow-raised",
              posterTints[index % posterTints.length]
            )}
            badge={
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold text-ink sm:text-sm",
                  free ? "bg-mint-tint" : "bg-surface"
                )}
              >
                {item.kind === "skill"
                  ? "Skill session"
                  : free
                    ? "Free"
                    : `${formatMoney(item.deposit_rm)} deposit`}
              </span>
            }
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
          />
          <p className="mt-2 font-display text-base leading-tight font-bold text-ink sm:text-lg">
            {item.title}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>
        </Link>
        <div className="absolute top-3 right-3 z-20">
          <SaveItemButton itemId={item.id} initiallySaved />
        </div>
      </div>
    </li>
  )
}
