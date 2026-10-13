import { cn } from "@workspace/ui/lib/utils"

export function BetterPointsChip({
  balance,
  variant = "default",
  className,
}: {
  balance: number
  variant?: "default" | "earned"
  className?: string
}) {
  if (variant === "earned") {
    const sign = balance > 0 ? "+" : balance < 0 ? "−" : ""
    return (
      <span
        className={cn(
          "inline-flex min-w-12 shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-sm font-bold text-ink tabular-nums",
          balance >= 0 ? "bg-sun-tint" : "bg-lilac-tint",
          className
        )}
      >
        <span className="sr-only">
          {balance >= 0 ? "Earned" : "Spent"} {Math.abs(balance).toLocaleString("en-MY")} BetterPoints
        </span>
        {sign}
        {Math.abs(balance).toLocaleString("en-MY")}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-ink py-1 pr-4 pl-1 text-white",
        className
      )}
    >
      <span aria-hidden="true" className="relative grid size-8 place-items-center rounded-full bg-lime-track">
        <span className="absolute inset-0 rounded-full border-4 border-lime [clip-path:inset(0_35%_0_0)]" />
        <span className="relative text-[9px] font-extrabold text-ink">BP</span>
      </span>
      <span aria-hidden="true" className="text-sm font-bold tabular-nums">
        {balance.toLocaleString("en-MY")} BP
      </span>
      <span className="sr-only">
        {balance.toLocaleString("en-MY")} BetterPoints, see your impact
      </span>
    </span>
  )
}
