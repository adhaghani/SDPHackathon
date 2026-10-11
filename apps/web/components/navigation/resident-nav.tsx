"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { residentNavigation } from "@/content/navigation"
import { copy } from "@/lib/i18n-copy"
import { cn } from "@workspace/ui/lib/utils"

export function ResidentNav({
  isAdmin = false,
  locale = "en",
}: {
  isAdmin?: boolean
  locale?: "en" | "ms"
}) {
  const pathname = usePathname()
  const localized = copy[locale]
  const navItems = residentNavigation.map((item) => ({
    ...item,
    label:
      item.href === "/home"
        ? localized.home
        : item.href === "/events"
          ? localized.events
          : item.href === "/borrow"
            ? localized.borrow
            : item.href === "/rewards"
              ? localized.rewards
              : localized.community,
  }))

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium text-muted-foreground",
                    active && "text-foreground"
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <nav
        aria-label="Primary"
        className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col"
      >
        <div className="flex min-h-16 items-center border-b border-border px-5">
          <Link href="/home" className="font-heading text-lg font-semibold">
            BorrowBetter
          </Link>
        </div>
        <ul className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                    active && "bg-muted text-foreground"
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </Link>
              </li>
            )
          })}
          {isAdmin ? (
            <li>
              <Link
                href="/admin"
                aria-current={pathname === "/admin" ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                  pathname === "/admin" && "bg-muted text-foreground"
                )}
              >
                Township Pulse
              </Link>
            </li>
          ) : null}
        </ul>
        <div className="border-t border-border p-3">
          <Link
            href="/profile"
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-muted"
          >
            {localized.profile}
          </Link>
        </div>
      </nav>
    </>
  )
}
