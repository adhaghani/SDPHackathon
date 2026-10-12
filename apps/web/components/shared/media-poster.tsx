import Image from "next/image"
import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * 3:4 poster for item and event cards. Text sits on an ink gradient scrim; the image is
 * anchored towards the top so labels and faces are not cropped.
 */
export function MediaPoster({
  src,
  alt,
  eyebrow,
  title,
  meta,
  badge,
  className,
  ratio = "aspect-[3/4]",
  priority = false,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
}: {
  src: string
  alt: string
  eyebrow?: string
  title?: string
  meta?: string | ReadonlyArray<string>
  badge?: ReactNode
  className?: string
  ratio?: string
  priority?: boolean
  sizes?: string
}) {
  const metaLines = (typeof meta === "string" ? [meta] : (meta ?? [])).slice(0, 2)
  const hasOverlay = Boolean(title || eyebrow || metaLines.length)

  return (
    <div className={cn("bb-on-ink relative isolate w-full overflow-hidden rounded-lg bg-lilac-tint", ratio, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-[50%_30%]"
      />
      {badge ? <div className="absolute top-3 left-3 z-10">{badge}</div> : null}
      {hasOverlay ? (
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink via-ink/80 to-transparent p-4 pt-20">
          {eyebrow ? <p className="text-eyebrow text-[11px] text-band-eyebrow">{eyebrow}</p> : null}
          {title ? <p className="mt-1 font-display text-lg leading-tight font-bold text-surface">{title}</p> : null}
          {metaLines.map((line) => (
            <p key={line} className="mt-0.5 truncate text-sm text-surface">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}
