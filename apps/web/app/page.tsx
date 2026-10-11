import { PlayIcon, UserPlusIcon } from "lucide-react"
import Link from "next/link"

import { TownshipLine } from "@/components/shared/township-line"
import { DemoRoleSwitcher } from "@/components/demo/demo-role-switcher"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { marketingContent } from "@/content/marketing"
import { isDemoMode, isFeatureEnabled } from "@/lib/env"
import { getPreferredLocale } from "@/lib/i18n"
import { copy } from "@/lib/i18n-copy"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default async function Page() {
  const locale = isFeatureEnabled("bm_ui") ? await getPreferredLocale() : "en"
  const localized = copy[locale]
  return (
    <div className="min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="font-heading text-lg font-semibold">
            {localized.brand}
          </Link>
          <nav aria-label="Account" className="flex items-center gap-2">
            <Button
              render={<Link href="/sign-in" />}
              variant="ghost"
              className="h-11"
            >
              {localized.signIn}
            </Button>
            <Button
              render={<Link href="/sign-up" />}
              className="hidden h-11 sm:inline-flex"
            >
              {localized.signUp}
            </Button>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <Badge variant="outline">People and Planet</Badge>
            <h1 className="mt-5 max-w-2xl font-heading text-4xl leading-tight font-semibold sm:text-5xl">
              {locale === "ms" ? "Perbandaran anda, disambungkan melalui aktiviti dunia sebenar." : marketingContent.headline}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              {locale === "ms" ? "Pinjam dan kongsi, sertai acara kejiranan, bantu jiran dan terima pengiktirafan untuk sumbangan yang disahkan." : marketingContent.description}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                render={<Link href="/sign-up" />}
                className="h-12 gap-2 px-5"
              >
                <UserPlusIcon aria-hidden="true" data-icon="inline-start" />
                {localized.signUp}
              </Button>
              <Button
                render={<Link href="/sign-in?next=/home" />}
                variant="outline"
                className="h-12 gap-2 px-5"
              >
                <PlayIcon aria-hidden="true" data-icon="inline-start" />
                {locale === "ms" ? "Cuba demo" : marketingContent.secondaryAction}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {locale === "ms" ? "Ciri utama percuma untuk penduduk. Pengendali perbandaran membayar untuk sistem ini." : "Core features are free for residents. Township operators pay for the managed system."}
            </p>
            {isFeatureEnabled("bm_ui") ? (
              <div className="mt-4">
              <LanguageSwitcher current={locale} next={locale === "en" ? "ms" : "en"} label={localized.switchLanguage} nextPath="/" />
              </div>
            ) : null}
            {isDemoMode() ? (
              <div className="mt-6 border-t border-border pt-5">
                <DemoRoleSwitcher />
              </div>
            ) : null}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              The township line
            </p>
            <TownshipLine stops={marketingContent.stops} />
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <h2 className="font-heading text-2xl font-semibold">
              The one loop to prove
            </h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-5">
              {marketingContent.loop.map((item, index) => (
                <li key={item} className="border-t-4 border-line-borrow pt-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-1 font-medium">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>{localized.tagline}</p>
        <p>Prototype for a university hackathon. No real brands or people.</p>
      </footer>
    </div>
  )
}
