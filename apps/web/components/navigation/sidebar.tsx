"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ActivityIcon, ArrowLeftIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react"

import { SIDEBAR_COOKIE, isActivePath } from "@/components/navigation/nav-utils"
import { SignOutButton } from "@/components/navigation/sign-out-button"
import { adminNavigation, sidebarNavigation } from "@/content/navigation"
import { cn } from "@workspace/ui/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>
}


export function Sidebar({
  isAdmin = false,
  displayName,
  townshipName,
  enabledFlags = [],
  defaultCollapsed = false,
}: {
  isAdmin?: boolean
  displayName: string
  townshipName: string
  enabledFlags?: string[]
  defaultCollapsed?: boolean
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const adminMode = isAdmin && (pathname === "/admin" || pathname.startsWith("/admin/"))
  const items: NavItem[] = adminMode
    ? adminNavigation.filter((item) => !("flag" in item) || enabledFlags.includes(item.flag))
    : [...sidebarNavigation]

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`
  }

  const ToggleIcon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon

  return (
    <nav
      id="app-sidebar"
      aria-label="Primary"
      data-collapsed={collapsed ? "true" : undefined}
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-hairline bg-surface transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-[4.75rem]" : "w-60 lg:w-64"
      )}
    >
      <div className={cn("bb-safe-top flex min-h-24 items-center gap-2 pt-6 pb-4", collapsed ? "flex-col justify-center px-3" : "px-5")}>
        <Link
          href="/home"
          aria-label="BorrowBetter home"
          className={cn("min-w-0 flex-1 rounded-md", collapsed && "flex-none")}
        >
          {collapsed ? (
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-lg bg-ink font-display text-lg font-extrabold text-surface">
              B
            </span>
          ) : (
            <>
              <span className="block truncate font-display text-xl font-extrabold text-ink">BorrowBetter</span>
              {adminMode ? <span className="mt-0.5 block text-eyebrow text-ink-muted">Township office</span> : null}
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="grid size-10 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors duration-150 ease-out hover:bg-ground hover:text-ink"
        >
          <ToggleIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </button>
      </div>

      <ul className={cn("flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto py-2", collapsed ? "px-3" : "px-3")}>
        {items.map((item) => (
          <li key={item.href}>
            <SidebarLink item={item} active={isActivePath(pathname, item.href)} collapsed={collapsed} />
          </li>
        ))}
        {isAdmin ? (
          <li className="mt-3 border-t border-hairline pt-3">
            <SidebarLink
              item={adminMode ? { href: "/home", label: "Resident view", icon: ArrowLeftIcon } : { href: "/admin", label: "Township Pulse", icon: ActivityIcon }}
              active={false}
              collapsed={collapsed}
            />
          </li>
        ) : null}
      </ul>

      <div className={cn("flex border-t border-hairline p-3", collapsed ? "flex-col items-center gap-1" : "items-center gap-2")}>
        <Link
          href="/profile"
          aria-current={isActivePath(pathname, "/profile") ? "page" : undefined}
          aria-label={collapsed ? `${displayName}, profile and settings` : undefined}
          title={collapsed ? displayName : undefined}
          className={cn(
            "flex min-h-12 min-w-0 items-center gap-3 rounded-lg transition-colors duration-150 ease-out hover:bg-ground aria-[current=page]:bg-lilac-tint",
            collapsed ? "justify-center p-1.5" : "flex-1 px-2"
          )}
        >
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-lilac font-display text-sm font-extrabold text-ink">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          {collapsed ? null : (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">{displayName}</span>
              <span className="block truncate text-xs text-ink-muted">{adminMode ? townshipName : "Profile & settings"}</span>
            </span>
          )}
        </Link>
        <SignOutButton compact className="text-ink-muted hover:text-ink" />
      </div>
    </nav>
  )
}

function SidebarLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg text-sm font-medium text-ink transition-colors duration-150 ease-out hover:bg-ground",
        collapsed ? "justify-center" : "px-3",
        active && "bg-lilac-tint font-bold hover:bg-lilac-tint"
      )}
    >
      <Icon aria-hidden={true} className="size-5 shrink-0" strokeWidth={active ? 2.3 : 1.7} />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
    </Link>
  )
}
