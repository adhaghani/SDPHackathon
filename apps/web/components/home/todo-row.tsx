import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function TodoRow({
  title,
  detail,
  href,
  actionLabel,
  urgent = false,
}: {
  title: string
  detail: string
  href: string
  actionLabel: string
  urgent?: boolean
}) {
  return (
    <li
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg p-4",
        urgent ? "bg-coral-tint" : "border border-hairline bg-surface"
      )}
    >
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>
      </div>
      <Button render={<Link href={href} />} variant={urgent ? "cta" : "outline"} className="shrink-0">
        {actionLabel}
      </Button>
    </li>
  )
}
