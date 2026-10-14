"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActivePath } from "@/components/navigation/nav-utils"
import { residentNavigation } from "@/content/navigation"
import { copy } from "@/lib/i18n-copy"
import { cn } from "@workspace/ui/lib/utils"

const labelKeys = {
  "/home": "home",
  "/borrow": "borrow",
  "/giveaway": "giveaway",
  "/recycling": "recycling",
  "/events": "events",
  "/rewards": "impact",
} as const

export function TabBar({ locale = "en" }: { locale?: "en" | "ms" }) {
  const pathname = usePathname()
  const localized = copy[locale]
  const onInkScreen = pathname.includes("/ticket")
  const hasActionDock =
    pathname.includes("/borrow/items/") ||
    pathname.includes("/borrow/bookings/")

  if (hasActionDock) return null

  return (
    <nav
      aria-label="Primary"
      className={`on-dark fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+18px)] left-4 z-50 grid grid-cols-5 gap-1 rounded-[26px] p-1.5 shadow-dock md:hidden ${onInkScreen ? "bg-ink-raised" : "bg-ink"}`}
    >
      {residentNavigation.map(({ href, icon: Icon }) => {
        const active = isActivePath(pathname, href)
        const label = href === "/home" ? "Block" : localized[labelKeys[href]]

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] text-xs font-semibold text-white transition-colors duration-150 ease-out",
              active && "bg-lime font-bold text-ink"
            )}
          >
            <Icon
              aria-hidden="true"
              className="size-[22px]"
              strokeWidth={active ? 2.4 : 1.75}
            />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
