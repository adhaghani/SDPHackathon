import { PublicImage as Image } from "@/components/shared/public-image"
import { CalendarDaysIcon, CheckIcon } from "lucide-react"

import { RedeemButton } from "@/components/rewards/redeem-button"
import { formatEventDate } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"

const kindLabels: Record<string, string> = {
  voucher: "Voucher",
  event_perk: "Event perk",
  amenity: "Amenity",
}

export function rewardImageFor(kind: string): string {
  if (kind === "event_perk") return "/demo/reward-event-perk.svg"
  if (kind === "amenity") return "/demo/reward-amenity.svg"
  return "/demo/reward-voucher.svg"
}

export function RewardCard({
  id,
  title,
  partnerName,
  kind,
  costBp,
  imagePath,
  balance,
  stock,
  description,
  validUntil,
}: {
  id: string
  title: string
  partnerName?: string | null
  kind: string
  costBp: number
  imagePath?: string | null
  balance: number
  stock?: number | null
  description?: string | null
  validUntil?: string | null
  isDemo?: boolean
}) {
  const missing = Math.max(0, costBp - balance)
  const affordable = missing === 0 && stock !== 0

  return (
    <li className="flex min-w-0 flex-col rounded-[20px] bg-paper text-ink">
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-t-[20px] bg-white">
        <Image
          src={imagePath || rewardImageFor(kind)}
          alt={title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{kindLabels[kind] ?? kind}</Badge>
          {affordable ? (
            <Badge>
              <CheckIcon aria-hidden="true" data-icon="inline-start" />
              Enough BP
            </Badge>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="text-xl leading-snug font-extrabold text-balance [overflow-wrap:anywhere]">
            {title}
          </h3>
          <p className="text-sm [overflow-wrap:anywhere] text-ink-soft">
            {partnerName ?? "Township reward"}
          </p>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed [overflow-wrap:anywhere] text-ink-soft">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex min-w-0 flex-col gap-3 pt-1">
          {validUntil ? (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
              <CalendarDaysIcon
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              Use by {formatEventDate(validUntil)}
            </p>
          ) : null}
          <Separator />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-2xl leading-tight font-extrabold tabular-nums">
              {costBp.toLocaleString("en-MY")}{" "}
              <span className="text-sm font-semibold">BP</span>
            </p>
            <p className="text-xs text-ink-soft">
              {stock === 0
                ? "Sold out"
                : stock == null
                  ? "Available"
                  : `${stock.toLocaleString("en-MY")} left`}
            </p>
          </div>
          <RedeemButton
            rewardId={id}
            costBp={costBp}
            missingBp={missing}
            soldOut={stock === 0}
          />
        </div>
      </div>
    </li>
  )
}
