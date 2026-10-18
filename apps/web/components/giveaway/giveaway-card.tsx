import { PublicImage as Image } from "@/components/shared/public-image"

import {
  GiveawayActions,
  type GiveawayRole,
} from "@/components/giveaway/giveaway-actions"
import { StatusPill } from "@/components/shared/status-pill"
import { cn } from "@workspace/ui/lib/utils"

export type GiveawayCardItem = {
  id: string
  title: string
  description: string
  condition: string
  photo_path: string
  handover_location: string
  handover_notes: string
  status: string
  giver_id: string
  taker_id: string | null
  giver_confirmed_at: string | null
  taker_confirmed_at: string | null
  created_at: string
  item_categories?: { name: string } | null
  giver_name?: string | null
  taker_name?: string | null
}

const conditionLabels: Record<string, string> = {
  unusable: "Unusable / for parts",
  worn: "Worn but working",
  good: "Good condition",
}

export function GiveawayCard({
  giveaway,
  currentUserId,
  className,
}: {
  giveaway: GiveawayCardItem
  currentUserId: string
  className?: string
}) {
  const role: GiveawayRole =
    giveaway.giver_id === currentUserId
      ? "giver"
      : giveaway.taker_id === currentUserId
        ? "taker"
        : "neighbour"

  return (
    <article className={cn("bb-card overflow-hidden", className)}>
      <div className="relative aspect-[4/3] overflow-hidden bg-lilac-tint">
        <Image
          src={giveaway.photo_path || "/demo/item-placeholder.svg"}
          alt={giveaway.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-[50%_30%]"
        />
        <div className="absolute top-3 left-3">
          <StatusPill status={giveaway.status} className="shadow-sm" />
        </div>
        <div className="absolute right-3 bottom-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink">
          Free giveaway
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-tag text-ink-muted">
            {giveaway.item_categories?.name ?? "Community item"} ·{" "}
            {conditionLabels[giveaway.condition] ?? giveaway.condition}
          </p>
          <h3 className="mt-1 text-title text-ink">{giveaway.title}</h3>
          <p className="mt-2 text-sm text-ink-muted">
            {giveaway.description ||
              "A neighbour is passing this on to the community."}
          </p>
        </div>

        <dl className="flex flex-col gap-1 text-sm text-ink-muted">
          <div className="flex gap-2">
            <dt className="font-semibold text-ink">From:</dt>
            <dd>{giveaway.giver_name ?? "A neighbour"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-ink">Handover:</dt>
            <dd>{giveaway.handover_location}</dd>
          </div>
          {giveaway.handover_notes ? (
            <div className="flex gap-2">
              <dt className="font-semibold text-ink">Note:</dt>
              <dd>{giveaway.handover_notes}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-1 border-t border-hairline pt-3">
          <GiveawayActions
            giveawayId={giveaway.id}
            status={giveaway.status}
            role={role}
            giverConfirmed={Boolean(giveaway.giver_confirmed_at)}
            takerConfirmed={Boolean(giveaway.taker_confirmed_at)}
          />
        </div>
      </div>
    </article>
  )
}
