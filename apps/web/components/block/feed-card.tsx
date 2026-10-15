import Image from "next/image"
import Link from "next/link"
import { HandHelpingIcon, PackageIcon } from "lucide-react"

import { PillarTag, type Pillar } from "@/components/block/pillar-tag"
import { cn } from "@workspace/ui/lib/utils"

type FeedCardProps = {
  variant: "item" | "event" | "help"
  href: string
  title: string
  meta: string
  image?: string | null
  date?: { day: string; number: string; month: string }
  walkingTime?: string
}

const pillars: Record<FeedCardProps["variant"], Pillar> = {
  item: "PINJAM",
  event: "JOM",
  help: "TOLONG",
}

export function FeedCard({
  variant,
  href,
  title,
  meta,
  image,
  date,
  walkingTime,
}: FeedCardProps) {
  const event = variant === "event"

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[116px] items-stretch gap-3 overflow-hidden rounded-[20px] p-3 transition-transform duration-150 ease-out",
        event ? "bg-ink text-white" : "bg-paper text-ink"
      )}
    >
      <div
        className={cn(
          "relative grid h-[88px] w-[66px] shrink-0 place-items-center overflow-hidden rounded-[14px] md:h-[110px] md:w-[82px]",
          event ? "bg-tomato text-ink" : "bg-white"
        )}
      >
        {event && date ? (
          <div className="text-center">
            <span className="block text-[10px] font-bold tracking-[0.08em] uppercase">{date.day}</span>
            <span className="block font-display text-[30px] leading-[30px] font-extrabold tabular-nums">{date.number}</span>
            <span className="block text-[10px] font-bold tracking-[0.08em] uppercase">{date.month}</span>
          </div>
        ) : image ? (
          <Image unoptimized src={image} alt="" fill sizes="82px" className="object-cover" />
        ) : variant === "help" ? (
          <HandHelpingIcon aria-hidden="true" className="size-8 text-ink" strokeWidth={1.8} />
        ) : (
          <PackageIcon aria-hidden="true" className="size-8 text-ink" strokeWidth={1.8} />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
        <div className="flex items-center gap-2">
          <PillarTag pillar={pillars[variant]} />
          {walkingTime ? (
            <span className={cn("truncate text-xs font-semibold", event ? "text-on-dark-muted" : "text-ink-soft")}>
              {walkingTime}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[17px] leading-[21px] font-bold text-balance">{title}</p>
        <p className={cn("mt-1 line-clamp-3 text-sm leading-[19px]", event ? "text-on-dark-muted" : "text-ink-soft")}>
          {meta}
        </p>
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "mt-auto mb-1 grid size-8 shrink-0 place-items-center rounded-full text-lg transition-colors",
          event ? "bg-white/10 text-white group-hover:bg-lime group-hover:text-ink" : "bg-white text-ink group-hover:bg-lime"
        )}
      >
        ›
      </span>
    </Link>
  )
}
