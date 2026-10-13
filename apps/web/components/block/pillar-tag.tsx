import { cn } from "@workspace/ui/lib/utils"

export type Pillar = "PINJAM" | "JOM" | "TOLONG"

export function PillarTag({
  pillar,
  className,
  inverted = false,
}: {
  pillar: Pillar
  className?: string
  inverted?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-5 items-center rounded-[6px] px-2 text-[11px] leading-4 font-bold tracking-[0.06em] text-ink uppercase",
        pillar === "PINJAM" && "bg-sky",
        pillar === "JOM" && "bg-lime",
        pillar === "TOLONG" && "bg-mustard",
        inverted && "ring-1 ring-white/20",
        className
      )}
    >
      {pillar}
    </span>
  )
}
