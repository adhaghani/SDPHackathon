import { SearchIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { NotificationBell } from "@/components/navigation/notification-bell"
import { SIDEBAR_COOKIE } from "@/components/navigation/nav-utils"
import { Sidebar } from "@/components/navigation/sidebar"
import { TabBar } from "@/components/navigation/tab-bar"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { RealtimeRefresh } from "@/components/shared/realtime-refresh"
import { getSessionContext } from "@/lib/data"
import { isDemoMode, isFeatureEnabled } from "@/lib/env"
import { getPreferredLocale } from "@/lib/i18n"
import { copy } from "@/lib/i18n-copy"
import { createClient } from "@/lib/supabase/server"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { cn } from "@workspace/ui/lib/utils"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getSessionContext()
  const locale = isFeatureEnabled("bm_ui") ? await getPreferredLocale() : "en"
  const localized = copy[locale]

  if (!context.user) {
    redirect("/sign-in")
  }

  if (context.membership?.status !== "active") {
    redirect("/onboarding")
  }

  const supabase = await createClient()
  const unread = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.user.id)
    .is("read_at", null)
  const comfort = context.profile?.comfort_prefs
  const comfortPrefs = comfort && typeof comfort === "object" && !Array.isArray(comfort)
    ? (comfort as Record<string, unknown>)
    : {}
  const comfortClass = cn(
    comfortPrefs.large_text === true && "bb-large-text",
    comfortPrefs.high_contrast === true && "bb-high-contrast",
    comfortPrefs.reduce_motion === true && "bb-reduce-motion"
  )

  const sidebarCollapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed"
  const isAdmin = context.membership?.role === "township_admin"
  const displayName = context.profile?.display_name?.split(" ")[0] ?? "Neighbour"
  const townshipName = context.membership?.townships?.name ?? "Your township"
  const enabledFlags = (["leaflet", "equipment_hubs"] as const).filter((flag) => isFeatureEnabled(flag))
  const iconButton =
    "grid size-11 place-items-center rounded-lg border border-hairline bg-surface text-ink transition-colors duration-150 ease-out hover:bg-ground"

  return (
    <div className={cn("min-h-svh bg-background", comfortClass)}>
      <RealtimeRefresh table="notifications" filter={`user_id=eq.${context.user.id}`} />
      <RealtimeRefresh table="points_ledger" filter={`user_id=eq.${context.user.id}`} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
      >
        Skip to content
      </a>
      {isDemoMode() ? (
        <div className="bb-safe-top bg-lilac-tint px-4 py-2 text-center text-sm font-bold text-ink">
          {localized.demoData}
        </div>
      ) : null}
      <div className="flex">
        <Sidebar
          isAdmin={isAdmin}
          displayName={context.profile?.display_name ?? displayName}
          townshipName={townshipName}
          enabledFlags={[...enabledFlags]}
          defaultCollapsed={sidebarCollapsed}
        />
        <div className="min-w-0 flex-1">
          <header
            className={cn(
              "sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-hairline bg-surface px-4 py-3 sm:px-6 lg:px-8",
              isDemoMode() ? "" : "bb-safe-top"
            )}
          >
            <Link href="/home" className="min-w-0 truncate font-display text-lg font-extrabold text-ink md:hidden">
              {localized.brand}
            </Link>
            <form action="/borrow" method="get" role="search" className="hidden max-w-xl flex-1 md:block">
              <label htmlFor="header-search" className="sr-only">Search items to borrow</label>
              <div className="flex h-11 items-center gap-2 rounded-lg border border-ink-muted bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
                <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
                <input
                  id="header-search"
                  name="q"
                  type="search"
                  placeholder="Search items to borrow"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted focus-visible:outline-none"
                />
              </div>
            </form>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {isFeatureEnabled("bm_ui") ? (
                <LanguageSwitcher
                  current={locale}
                  next={locale === "en" ? "ms" : "en"}
                  label={localized.switchLanguage}
                  nextPath="/home"
                  compact
                />
              ) : null}
              <BetterPointsChip balance={context.points?.balance ?? 0} className="hidden sm:inline-flex" />
              <Link href="/borrow" aria-label="Search items to borrow" className={cn(iconButton, "md:hidden")}>
                <SearchIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </Link>
              <NotificationBell count={unread.count ?? 0} />
              <Link href="/profile" aria-label={localized.profile} className={cn(iconButton, "md:hidden")}>
                <UserRoundIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </Link>
            </div>
          </header>
          <main
            id="main-content"
            className="w-full px-4 pt-6 pb-32 sm:px-6 md:pb-14 lg:px-8 lg:pt-8"
          >
            {children}
          </main>
        </div>
      </div>
      <TabBar locale={locale} />
    </div>
  )
}
