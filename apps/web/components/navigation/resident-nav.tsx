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
        : item.href === "/borrow"
          ? localized.borrow
          : item.href === "/events"
            ? localized.events
            : localized.impact,
  }))

  return (
    <>
      <nav
        aria-label="Primary"
        className="bb-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 px-2.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)

            return (
              <li key={href} className="flex justify-center py-3">
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-lilac-tint hover:text-ink",
                    active && "bg-lilac-tint text-ink"
                  )}
                >
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />
                  <span className="sr-only">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <nav
        aria-label="Primary"
        className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex"
      >
        <div className="bb-safe-top flex min-h-16 items-center border-b border-border px-5">
          <Link href="/home" className="font-display text-lg text-ink">
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
                    "flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-lilac-tint hover:text-ink",
                    active && "bg-lilac-tint text-ink"
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
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
                  "flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm font-bold text-muted-foreground transition-colors hover:bg-lilac-tint hover:text-ink",
                  pathname === "/admin" && "bg-lilac-tint text-ink"
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
            className="flex min-h-12 items-center gap-3 rounded-sm px-3 text-sm font-bold hover:bg-lilac-tint"
          >
            {localized.profile}
          </Link>
        </div>
      </nav>
    </>
  )
}
