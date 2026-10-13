import { cn } from "@workspace/ui/lib/utils"

export function BlockGoalCard({
  goalLabel,
  target,
  current,
  mine,
  daysLeft,
  bonusBp,
  className,
}: {
  goalLabel: string
  target: number
  current: number
  mine: number
  daysLeft: number
  bonusBp: number
  className?: string
}) {
  const totalPercent = Math.min(100, Math.round((current / target) * 100))
  const minePercent = Math.min(totalPercent, Math.max(1.5, Math.round((mine / target) * 100)))

  return (
    <section className={cn("rounded-[22px] bg-sky p-5 text-ink", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] leading-4 font-bold tracking-[0.06em] uppercase">YOUR BLOCK · OCTOBER GOAL</p>
          <h2 className="mt-1 font-display text-[24px] leading-7 font-extrabold">{goalLabel}</h2>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={`${goalLabel}: ${current} of ${target}`}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={current}
        className="mt-5 flex h-3.5 overflow-hidden rounded-full bg-white"
      >
        <div className="h-full bg-ink" style={{ width: `${totalPercent - minePercent}%` }} />
        <div className="h-full bg-tomato" style={{ width: `${minePercent}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <span>
          <strong className="tabular-nums">{current.toLocaleString("en-MY")}</strong> so far ·{" "}
          <span aria-hidden="true" className="inline-block size-2.5 rounded-[3px] bg-tomato align-middle" />{" "}
          <strong className="tabular-nums">{mine.toLocaleString("en-MY")}</strong> are yours
        </span>
        <span className="tabular-nums">{daysLeft} days left</span>
      </div>
      <p className="mt-2 text-[13px]">
        If the block hits {target.toLocaleString("en-MY")}, everyone gets +{bonusBp} BP.
      </p>
    </section>
  )
}
