"use client"

import { BrandLogo } from "@/components/shared/brand-logo"

import { IntentLink as Link } from "@/components/shared/intent-link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ActivityIcon,
  ArrowLeftIcon,
  CalendarDays,
  GiftIcon,
  House,
  Leaf,
  MenuIcon,
  Package,
  RecycleIcon,
  XIcon,
} from "lucide-react"

import { isActivePath } from "@/components/navigation/nav-utils"
import { NotificationBell } from "@/components/navigation/notification-bell"
import { SignOutButton } from "@/components/navigation/sign-out-button"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { adminNavigation, sidebarNavigation } from "@/content/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>
}

const residentPrimaryItems: NavItem[] = [
  { href: "/home", label: "Block", icon: House },
  { href: "/borrow", label: "Borrow", icon: Package },
  { href: "/recycling", label: "Recycle", icon: RecycleIcon },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/rewards", label: "Impact", icon: Leaf },
]

const residentSecondaryItems: NavItem[] = sidebarNavigation
  .filter((item) => !residentPrimaryItems.some((primary) => primary.href === item.href))
  .map(({ href, label, icon }) => ({ href, label, icon }))

export function MobileNavigation({
  isAdmin = false,
  displayName,
  townshipName,
  enabledFlags = [],
  balance = 0,
  unreadCount = 0,
}: {
  isAdmin?: boolean
  displayName: string
  townshipName: string
  enabledFlags?: string[]
  balance?: number
  unreadCount?: number
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const adminMode = isAdmin && (pathname === "/admin" || pathname.startsWith("/admin/"))
  const adminItems: NavItem[] = adminMode
    ? adminNavigation
        .filter((item) => !("flag" in item) || enabledFlags.includes(item.flag))
        .map(({ href, label, icon }) => ({ href, label, icon }))
    : []
  const items = adminMode ? adminItems : [...residentPrimaryItems, ...residentSecondaryItems]

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <>
      <Button
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed top-4 right-4 z-40 size-12 rounded-full bg-ink text-white shadow-dock hover:bg-ink-raised md:hidden",
          open && "hidden"
        )}
      >
        <MenuIcon aria-hidden="true" className="size-5" strokeWidth={1.9} />
      </Button>
      {open ? (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[70] bg-black/45 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-y-0 left-0 z-[80] flex w-[min(88vw,340px)] flex-col overflow-hidden bg-ink text-white shadow-dock md:hidden"
          >
        <div className="on-dark flex h-full min-h-0 flex-col bg-ink">
          <div className="flex items-start justify-between gap-3 border-b border-white/15 px-4 pt-4 pb-3">
            <Link href="/home" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3">
              <span className="min-w-0">
                <BrandLogo variant="dark" className="w-44" />
                <p className="truncate text-sm text-on-dark-muted">
                  {adminMode ? "Township office" : townshipName}
                </p>
              </span>
            </Link>
            <Button
              aria-label="Close navigation"
              autoFocus
              onClick={() => setOpen(false)}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <XIcon aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 px-4 py-3">
            <BetterPointsChip balance={balance} className="min-w-0 flex-1" />
            <NotificationBell count={unreadCount} onClick={() => setOpen(false)} />
          </div>

          <nav aria-label={adminMode ? "Township tools" : "Navigation"} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <MobileNavLink
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
              {isAdmin ? (
                <li className="mt-3 border-t border-white/15 pt-3">
                  <MobileNavLink
                    item={
                      adminMode
                        ? { href: "/home", label: "Resident view", icon: ArrowLeftIcon }
                        : { href: "/admin", label: "Township Pulse", icon: ActivityIcon }
                    }
                    active={false}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ) : null}
            </ul>
          </nav>

          <div className="border-t border-white/15 p-3">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              aria-current={isActivePath(pathname, "/profile") ? "page" : undefined}
              className="flex min-h-14 items-center gap-3 rounded-[18px] px-2 text-white transition-colors duration-150 ease-out hover:bg-ink-raised aria-[current=page]:bg-lime aria-[current=page]:text-ink"
            >
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-sky font-display text-sm font-extrabold text-ink">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{displayName}</span>
                <span className="block truncate text-xs text-on-dark-muted">Profile & settings</span>
              </span>
              <GiftIcon aria-hidden="true" className="size-4 text-on-dark-muted" />
            </Link>
            <SignOutButton compact className="mt-1 w-full justify-start px-3 text-on-dark-muted hover:bg-ink-raised hover:text-white" />
          </div>
        </div>
          </aside>
        </>
      ) : null}
    </>
  )
}

function MobileNavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-[17px] px-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-ink-raised",
        active && "bg-lime text-ink hover:bg-lime"
      )}
    >
      <Icon aria-hidden={true} className="size-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}
