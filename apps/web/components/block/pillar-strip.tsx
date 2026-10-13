import { PillarTag } from "@/components/block/pillar-tag"
import { cn } from "@workspace/ui/lib/utils"

export function PillarStrip({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <PillarTag pillar="PINJAM" />
      <PillarTag pillar="JOM" />
      <PillarTag pillar="TOLONG" />
      {!compact ? (
        <span className="inline-flex min-h-5 items-center rounded-[6px] bg-ink px-2 text-[11px] leading-4 font-bold tracking-[0.06em] text-white uppercase">
          Shared goal
        </span>
      ) : null}
    </div>
  )
}
