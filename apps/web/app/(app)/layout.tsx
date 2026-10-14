import Link from "next/link"
import { redirect } from "next/navigation"

import { Sidebar } from "@/components/navigation/sidebar"
import { MobileNavigation } from "@/components/navigation/mobile-navigation"
import { TabBar } from "@/components/navigation/tab-bar"
import { PageSurface } from "@/components/shared/page-surface"
import { RealtimeRefresh } from "@/components/shared/realtime-refresh"
import { getSessionContext } from "@/lib/data"
import { isFeatureEnabled } from "@/lib/env"
import { getPreferredLocale } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@workspace/ui/lib/utils"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await getSessionContext()
  const locale = isFeatureEnabled("bm_ui") ? await getPreferredLocale() : "en"

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

  const isAdmin = context.membership?.role === "township_admin"
  const displayName = context.profile?.display_name?.split(" ")[0] ?? "Neighbour"
  const townshipName = context.membership?.townships?.name ?? "Your township"
  const enabledFlags = (["leaflet", "equipment_hubs", "ai_search"] as const).filter((flag) => isFeatureEnabled(flag))

  return (
    <div className={cn("min-h-svh bg-paper text-ink", comfortClass)}>
      <RealtimeRefresh table="notifications" filter={`user_id=eq.${context.user.id}`} />
      <RealtimeRefresh table="points_ledger" filter={`user_id=eq.${context.user.id}`} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Sidebar
        isAdmin={isAdmin}
        displayName={context.profile?.display_name ?? displayName}
        townshipName={townshipName}
        enabledFlags={[...enabledFlags]}
        balance={context.points?.balance ?? 0}
        unreadCount={unread.count ?? 0}
      />
      <main
        id="main-content"
        className="w-full min-h-svh px-4 pt-4 pb-32 sm:px-6 md:pl-[292px] md:pr-8 md:pb-12 lg:pr-10"
      >
        <div className="mx-auto w-full max-w-[1240px]">
          <PageSurface>{children}</PageSurface>
        </div>
      </main>
      <TabBar locale={locale} />
      <MobileNavigation
        isAdmin={isAdmin}
        displayName={displayName}
        townshipName={townshipName}
        enabledFlags={[...enabledFlags]}
        balance={context.points?.balance ?? 0}
        unreadCount={unread.count ?? 0}
      />
      <Link
        href="/profile/settings"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:bottom-24 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Profile and settings
      </Link>
    </div>
  )
}
