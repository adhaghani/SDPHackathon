import { cn } from "@workspace/ui/lib/utils"

/** Visible label for seeded, fictional content. */
export function DemoLabel({ tone = "light", className }: { tone?: "light" | "ink"; className?: string }) {
  return (
    <span
      className={cn(
        "text-eyebrow inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px]",
        tone === "ink" ? "border-band-eyebrow text-band-eyebrow" : "border-ink-muted text-ink",
        className
      )}
    >
      Demo data
    </span>
  )
}
