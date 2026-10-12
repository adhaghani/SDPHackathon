import { BellIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ResidentNav } from "@/components/navigation/resident-nav"
import { SignOutButton } from "@/components/navigation/sign-out-button"
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

  return (
    <div className={cn("min-h-svh bg-background", comfortClass)}>
      <RealtimeRefresh table="notifications" filter={`user_id=eq.${context.user.id}`} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      {isDemoMode() ? (
        <div className="bg-sun-tint px-4 py-2 text-center text-sm font-bold text-ink">
          {localized.demoData}
        </div>
      ) : null}
      <div className="flex">
        <ResidentNav isAdmin={context.membership?.role === "township_admin"} locale={locale} />
        <div className="min-w-0 flex-1">
          <header className="bb-band bb-safe-top flex min-h-16 items-center justify-between rounded-none px-4 py-3 sm:px-6">
            <Link href="/home" className="font-display text-lg text-white lg:hidden">
              {localized.brand}
            </Link>
            <div className="ml-auto flex items-center gap-1 text-white">
              {isFeatureEnabled("bm_ui") ? <LanguageSwitcher current={locale} next={locale === "en" ? "ms" : "en"} label={localized.switchLanguage} nextPath="/home" className="text-white hover:bg-white/10 hover:text-white" /> : null}
              <Link href="/profile" className="flex min-h-11 items-center rounded-sm px-3 hover:bg-white/10" aria-label="Profile">
                <UserRoundIcon aria-hidden="true" className="size-5" />
              </Link>
              <Link href="/notifications" className="relative flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm font-bold hover:bg-white/10" aria-label={`Notifications, ${unread.count ?? 0} unread`}>
                <BellIcon aria-hidden="true" className="size-5" />
                {unread.count ? <span className="rounded-full bg-sun px-1.5 text-xs font-bold text-ink">{unread.count}</span> : null}
              </Link>
              <SignOutButton className="text-white hover:bg-white/10 hover:text-white" />
            </div>
          </header>
          <main
            id="main-content"
            className="mx-auto max-w-5xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
