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
  "/events": "events",
  "/rewards": "impact",
} as const

export function TabBar({ locale = "en" }: { locale?: "en" | "ms" }) {
  const pathname = usePathname()
  const localized = copy[locale]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2">
        {residentNavigation.map(({ href, icon: Icon }) => {
          const active = isActivePath(pathname, href)

          return (
            <li key={href} className="min-w-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-ink-muted transition-colors duration-150 ease-out hover:text-ink",
                  active && "bg-lilac-tint text-ink"
                )}
              >
                <Icon aria-hidden="true" className="size-6" strokeWidth={active ? 2.4 : 1.7} />
                <span className={cn("max-w-full truncate text-xs leading-none", active ? "font-bold" : "font-medium")}>
                  {localized[labelKeys[href]]}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
