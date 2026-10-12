import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

export function PageBand({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "bb-band -mx-4 -mt-6 mb-6 rounded-b-[28px] px-5 pt-8 pb-6 sm:-mx-6 sm:px-6",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[13px] font-bold text-band-eyebrow">{eyebrow}</p>
            ) : null}
            <h1 className="mt-1 font-display text-[30px] leading-[1.1] text-white sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-base text-band-eyebrow">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </section>
  )
}
