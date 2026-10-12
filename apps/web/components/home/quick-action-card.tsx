import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

const tints = {
  coral: "bg-coral-tint",
  sun: "bg-sun-tint",
  lilac: "bg-lilac-tint",
  mint: "bg-mint-tint",
} as const

export function QuickActionCard({
  href,
  label,
  icon: Icon,
  tint,
}: {
  href: string
  label: string
  icon: LucideIcon
  tint: keyof typeof tints
}) {
  return (
    <Link
      href={href}
      className="bb-card flex min-h-24 flex-col items-start justify-between gap-3 p-4 text-ink motion-safe:hover:-translate-y-0.5 lg:min-h-0 lg:flex-row lg:items-center lg:justify-start"
    >
      <span aria-hidden="true" className={cn("grid size-9 shrink-0 place-items-center rounded-md", tints[tint])}>
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <span className="font-display text-base leading-tight font-bold">{label}</span>
    </Link>
  )
}
