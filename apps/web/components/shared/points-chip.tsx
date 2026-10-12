export function PointsChip({ balance }: { balance: number }) {
  return (
    <div
      className="inline-flex min-h-12 min-w-20 shrink-0 flex-col items-start justify-center rounded-md bg-sun px-3 py-2 text-ink"
      aria-label={`${balance.toLocaleString("en-MY")} BetterPoints`}
    >
      <span className="font-display text-xl leading-none font-bold tabular-nums">
        {balance.toLocaleString("en-MY")}
      </span>
      <span className="mt-1 text-[11px] leading-none font-bold">BetterPoints</span>
    </div>
  )
}
