import Image from "next/image"

import { RedeemButton } from "@/components/rewards/redeem-button"
import { DemoLabel } from "@/components/shared/demo-label"

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
  isDemo = false,
}: {
  id: string
  title: string
  partnerName?: string | null
  kind: string
  costBp: number
  imagePath?: string | null
  balance: number
  stock?: number | null
  isDemo?: boolean
}) {
  const missing = Math.max(0, costBp - balance)
  return (
    <li className="bb-card flex h-full min-w-0 flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-sun-tint">
        <Image
          src={imagePath ?? rewardImageFor(kind)}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
        {isDemo ? <DemoLabel className="absolute top-2 left-2 bg-surface" /> : null}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-eyebrow text-[11px] text-ink-muted">
          {partnerName ?? "Township"} · {kindLabels[kind] ?? kind}
        </p>
        <p className="mt-1 font-display text-base leading-snug font-bold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted tabular-nums">
          {costBp.toLocaleString("en-MY")} BP{typeof stock === "number" ? ` · ${stock} left` : ""}
        </p>
        <div className="mt-auto pt-3">
          <RedeemButton rewardId={id} costBp={costBp} missingBp={missing} soldOut={stock === 0} />
        </div>
      </div>
    </li>
  )
}
