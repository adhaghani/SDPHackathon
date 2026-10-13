import { cn } from "@workspace/ui/lib/utils"

export function ProgressRing({
  value,
  level,
  size = 112,
  className,
}: {
  value: number
  level: number | string
  size?: number
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      role="img"
      aria-label={`Level ${level}, ${Math.round(clamped)} percent progress`}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 112 112" className="size-full -rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="var(--bb-lime-track)" strokeWidth="14" />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--bb-ink)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-extrabold text-ink">
        Lv {level}
      </span>
    </div>
  )
}
