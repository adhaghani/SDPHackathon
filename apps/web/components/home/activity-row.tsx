import { BetterPointsChip } from "@/components/shared/better-points-chip"

export function ActivityRow({ title, detail, delta }: { title: string; detail: string; delta: number }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>
      </div>
      <BetterPointsChip variant="earned" balance={delta} />
    </li>
  )
}
