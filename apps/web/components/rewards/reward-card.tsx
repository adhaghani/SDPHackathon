import { RedeemButton } from "@/components/rewards/redeem-button"
import { cn } from "@workspace/ui/lib/utils"

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
  balance,
  stock,
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
  const affordable = missing === 0 && stock !== 0

  return (
    <li
      className={cn(
        "flex h-[184px] min-w-[200px] max-w-[200px] flex-col gap-2 overflow-hidden rounded-[22px] p-3.5 text-ink",
        affordable ? "bg-mustard" : "bg-paper"
      )}
    >
      <p className="truncate text-xs font-bold tracking-[0.06em] uppercase">
        {partnerName ?? "Township"} · {kindLabels[kind] ?? kind}
      </p>
      <p className="line-clamp-2 min-h-[48px] text-[22px] leading-6 font-extrabold text-balance">{title}</p>
      <div className="mt-auto min-h-[44px] pt-1">
        <RedeemButton rewardId={id} costBp={costBp} missingBp={missing} soldOut={stock === 0} />
      </div>
    </li>
  )
}
