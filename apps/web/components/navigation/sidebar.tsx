"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ActivityIcon, ArrowLeftIcon, CalendarDays, GiftIcon, HandHelpingIcon, House, Leaf, Package } from "lucide-react"

import { isActivePath } from "@/components/navigation/nav-utils"
import { NotificationBell } from "@/components/navigation/notification-bell"
import { SignOutButton } from "@/components/navigation/sign-out-button"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { adminNavigation, sidebarNavigation } from "@/content/navigation"
import { cn } from "@workspace/ui/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>
}

const primaryItems: NavItem[] = [
  { href: "/home", label: "Block", icon: House },
  { href: "/borrow", label: "Borrow", icon: Package },
  { href: "/giveaway", label: "Giveaway", icon: HandHelpingIcon },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/rewards", label: "Impact", icon: Leaf },
]

const secondaryItems: NavItem[] = sidebarNavigation
  .filter((item) => !primaryItems.some((primary) => primary.href === item.href))
  .map(({ href, label, icon }) => ({ href, label, icon }))

export function Sidebar({
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
  const adminMode = isAdmin && (pathname === "/admin" || pathname.startsWith("/admin/"))
  const adminItems: NavItem[] = adminMode
    ? adminNavigation
        .filter((item) => !("flag" in item) || enabledFlags.includes(item.flag))
        .map(({ href, label, icon }) => ({ href, label, icon }))
    : []

  return (
    <aside id="app-sidebar" className="on-dark fixed top-5 bottom-5 left-5 z-40 hidden w-[252px] flex-col overflow-hidden rounded-[28px] bg-ink text-white shadow-dock md:flex">
      <Link href="/home" className="flex items-center gap-3 px-5 pt-6 pb-5">
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-lime font-display text-lg font-extrabold text-ink">B</span>
        <span>
          <span className="block font-display text-lg leading-none font-extrabold">BorrowLah</span>
          <span className="mt-1 block text-xs text-on-dark-muted">{adminMode ? "Township office" : townshipName}</span>
        </span>
      </Link>

      <div className="flex items-center gap-2 px-4 pb-4">
        <BetterPointsChip balance={balance} className="min-w-0 flex-1" />
        <NotificationBell count={unreadCount} />
      </div>

      <nav aria-label="Primary" className="px-3">
        <ul className="flex flex-col gap-1">
          {primaryItems.map((item) => (
            <li key={item.href}>
              <SidebarLink item={item} active={isActivePath(pathname, item.href)} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="mx-5 my-4 h-px bg-white/15" />

      <ScrollArea className="min-h-0 flex-1 px-3 pb-3" contentClassName="min-h-full">
      <nav className="w-full" aria-label={adminMode ? "Township tools" : "More"}>
        <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.08em] text-on-dark-muted uppercase">
          {adminMode ? "Township tools" : "More"}
        </p>
        <ul className="flex flex-col gap-1">
          {(adminMode ? adminItems : secondaryItems).map((item) => (
            <li key={item.href}>
              <SidebarLink item={item} active={isActivePath(pathname, item.href)} compact />
            </li>
          ))}
          {isAdmin ? (
            <li className="mt-3 border-t border-white/15 pt-3">
              <SidebarLink
                item={
                  adminMode
                    ? { href: "/home", label: "Resident view", icon: ArrowLeftIcon }
                    : { href: "/admin", label: "Township Pulse", icon: ActivityIcon }
                }
                active={false}
                compact
              />
            </li>
          ) : null}
        </ul>
      </nav>
      </ScrollArea>

      <div className="border-t border-white/15 p-3">
        <Link
          href="/profile"
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
    </aside>
  )
}

function SidebarLink({
  item,
  active,
  compact = false,
}: {
  item: NavItem
  active: boolean
  compact?: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-[17px] px-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-ink-raised",
        compact ? "min-h-11 text-[13px]" : "text-[15px]",
        active && "bg-lime text-ink hover:bg-lime"
      )}
    >
      <Icon aria-hidden={true} className="size-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}
