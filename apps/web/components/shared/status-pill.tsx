import { cn } from "@workspace/ui/lib/utils"

const tones: Record<string, string> = {
  // positive / done
  completed: "bg-mint-tint",
  issued: "bg-mint-tint",
  used: "bg-ground",
  expired: "bg-coral-tint",
  checked_in: "bg-mint-tint",
  approved: "bg-mint-tint",
  active: "bg-mint-tint",
  published: "bg-mint-tint",
  going: "bg-lilac-tint",
  // in progress
  requested: "bg-lilac-tint",
  handed_over: "bg-lilac-tint",
  pending_approval: "bg-lilac-tint",
  waitlisted: "bg-coral-tint",
  // needs attention
  disputed: "bg-coral-tint",
  declined: "bg-coral-tint",
  rejected: "bg-coral-tint",
  no_show: "bg-coral-tint",
}

const labels: Record<string, string> = {
  handed_over: "With borrower",
  checked_in: "Checked in",
  no_show: "No-show",
  pending_approval: "Awaiting approval",
}

/** Status is always spelled out; the tint only reinforces it. */
export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ink first-letter:uppercase",
        tones[status] ?? "bg-ground",
        className
      )}
    >
      {labels[status] ?? status.replaceAll("_", " ")}
    </span>
  )
}
