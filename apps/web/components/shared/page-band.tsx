import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronLeftIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

/** Shared lime page header used across resident, admin and partner screens. */
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
    <header className={cn("mb-6 overflow-hidden rounded-[22px] bg-lime p-5 text-ink sm:p-6", className)}>
      {back ? (
        <Link
          href={back.href}
          className="-ml-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-full pr-3 text-sm font-bold text-ink hover:underline hover:underline-offset-4"
        >
          <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-white">
            <ChevronLeftIcon aria-hidden="true" className="size-5" />
          </span>
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64">
          {eyebrow ? <p className="text-tag text-ink-soft">{eyebrow}</p> : null}
          <h1 className="text-h1 mt-2 text-balance break-words">{title}</h1>
          {description ? <p className="mt-3 max-w-[62ch] text-body text-ink-soft">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  )
}
