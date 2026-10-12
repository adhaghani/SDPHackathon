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
        aria-label={`${balance >= 0 ? "Earned" : "Spent"} ${Math.abs(balance).toLocaleString("en-MY")} BetterPoints`}
      >
        {sign}
        {Math.abs(balance).toLocaleString("en-MY")}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full bg-sun py-1 pr-4 pl-1 text-ink",
        className
      )}
      aria-label={`${balance.toLocaleString("en-MY")} BetterPoints`}
    >
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-ink text-[10px] font-extrabold text-sun">
        BP
      </span>
      <span aria-hidden="true" className="text-base font-bold tabular-nums">
        {balance.toLocaleString("en-MY")}
      </span>
    </span>
  )
}
