import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronLeftIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Light page header used by every screen without a hero band: eyebrow, Syne title,
 * a short description and actions. Dark bands are reserved for hero moments.
 */
export function PageBand({
  eyebrow,
  title,
  description,
  actions,
  back,
  children,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  back?: { href: string; label: string }
  children?: ReactNode
  className?: string
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4", className)}>
      {back ? (
        <Link
          href={back.href}
          className="-ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-md pr-2 text-sm font-bold text-ink hover:underline hover:underline-offset-4"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64">
          {eyebrow ? <p className="text-eyebrow text-ink-muted">{eyebrow}</p> : null}
          <h1 className="text-display-lg mt-1 text-balance break-words text-ink">{title}</h1>
          {description ? <p className="mt-2 max-w-[62ch] text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  )
}
