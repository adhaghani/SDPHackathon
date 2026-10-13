import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function SectionHeading({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 className="text-h2 text-balance text-ink">{title}</h2>
        {description ? <p className="mt-1 text-body text-balance text-ink-soft">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">{actions}</div>
      ) : null}
    </div>
  )
}
