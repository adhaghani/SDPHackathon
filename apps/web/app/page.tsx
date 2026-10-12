import Link from "next/link"
import {
  BadgeCheckIcon,
  CalendarDaysIcon,
  EyeOffIcon,
  HandHelpingIcon,
  LeafIcon,
  PackageIcon,
  PlayIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "lucide-react"

import { DemoRoleSwitcher } from "@/components/demo/demo-role-switcher"
import { ActivityRow } from "@/components/home/activity-row"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import { DemoLabel } from "@/components/shared/demo-label"
import { TownshipLine } from "@/components/shared/township-line"
import { marketingContent } from "@/content/marketing"
import { isDemoMode, isFeatureEnabled } from "@/lib/env"
import { getPreferredLocale } from "@/lib/i18n"
import { copy } from "@/lib/i18n-copy"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const lines = [
  {
    name: "Pinjam",
    english: "Borrow and lend",
    icon: PackageIcon,
    tint: "bg-coral-tint",
    body: "Ladders, drills, folding tables, tents. Request, hand over in a shared space, and both sides confirm the return.",
    example: "+40 BP when a loan is returned and confirmed",
  },
  {
    name: "Jom",
    english: "Neighbourhood events",
    icon: CalendarDaysIcon,
    tint: "bg-sun-tint",
    body: "Gotong-royong, repair cafés, swap markets. Register, then check in at the door with a QR ticket.",
    example: "+50 BP after a verified check-in",
  },
  {
    name: "Tolong",
    english: "Helping hands",
    icon: HandHelpingIcon,
    tint: "bg-mint-tint",
    body: "Carry groceries, water plants, walk someone to the clinic. Small, practical requests between neighbours.",
    example: "+30 BP when the neighbour confirms",
  },
  {
    name: "Rimba",
    english: "Shared goals",
    icon: LeafIcon,
    tint: "bg-lilac-tint",
    body: "Township challenges and estimated impact: things reused instead of bought, hours volunteered.",
    example: "+200 BP when a challenge is completed",
  },
] as const

const pulseBars = [
  { name: "Pinjam", value: 82, bar: "bg-coral" },
  { name: "Jom", value: 64, bar: "bg-sun" },
  { name: "Tolong", value: 38, bar: "bg-mint" },
  { name: "Rimba", value: 26, bar: "bg-lilac" },
]

export default async function Page() {
  const locale = isFeatureEnabled("bm_ui") ? await getPreferredLocale() : "en"
  const localized = copy[locale]
  const demo = isDemoMode()

  return (
    <div className="min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
      >
        Skip to content
      </a>
      <header className="bb-safe-top sticky top-0 z-40 border-b border-hairline bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-extrabold text-ink">
            {localized.brand}
          </Link>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {[
              ["#how", "How it works"],
              ["#townships", "For township offices"],
              ["#sponsors", "For sponsors"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full px-3 py-2 text-sm font-bold text-ink transition-colors duration-150 ease-out hover:bg-ground">
                {label}
              </a>
            ))}
          </nav>
          <nav aria-label="Account" className="flex items-center gap-2">
            {isFeatureEnabled("bm_ui") ? (
              <LanguageSwitcher current={locale} next={locale === "en" ? "ms" : "en"} label={localized.switchLanguage} nextPath="/" compact />
            ) : null}
            <Button render={<Link href="/sign-in" />} variant="ghost">
              {localized.signIn}
            </Button>
            <Button render={<Link href="/sign-up" />} variant="cta" className="hidden sm:inline-flex">
              {localized.signUp}
            </Button>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="bb-band overflow-hidden rounded-b-band">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-12 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
            <div>
              <p className="inline-flex rounded-full bg-mint px-3 py-1 text-sm font-bold text-ink">
                People and Planet · for Malaysian townships
              </p>
              <h1 className="mt-6 max-w-[16ch] font-display text-[40px] leading-[1.02] font-extrabold text-balance text-surface sm:text-6xl lg:text-[68px]">
                {locale === "ms" ? "Perbandaran anda, disambungkan melalui aktiviti dunia sebenar." : marketingContent.headline}
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg text-band-eyebrow">
                {locale === "ms"
                  ? "Pinjam dan kongsi, sertai acara kejiranan, bantu jiran dan terima pengiktirafan untuk sumbangan yang disahkan."
                  : marketingContent.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button render={<Link href="/sign-up" />} variant="cta" size="cta" className="w-full sm:w-auto">
                  <UserPlusIcon aria-hidden="true" data-icon="inline-start" />
                  {localized.signUp}
                </Button>
                <Button render={<Link href="/sign-in?next=/home" />} variant="outline" size="cta" className="w-full sm:w-auto">
                  <PlayIcon aria-hidden="true" data-icon="inline-start" />
                  {locale === "ms" ? "Cuba demo" : marketingContent.secondaryAction}
                </Button>
              </div>
              <p className="mt-4 text-sm text-band-eyebrow">
                {locale === "ms"
                  ? "Ciri utama percuma untuk penduduk. Pengendali perbandaran membayar untuk sistem ini."
                  : "Free for residents. Township operators pay for the managed system."}
              </p>
              {demo ? (
                <div className="mt-8 max-w-xl rounded-lg border border-white/15 p-4">
                  <DemoRoleSwitcher />
                </div>
              ) : null}
            </div>

            <HeroPreview demo={demo} />
          </div>
        </section>

        {/* Four lines */}
        <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-eyebrow text-ink-muted">How it works</p>
            <h2 className="text-display-lg mt-2 text-ink lg:text-5xl lg:leading-[1.05]">Four lines run through every township</h2>
            <p className="mt-4 text-lg text-ink-muted">
              Each line is a kind of real-world contribution. Residents move along them by doing things, not by opening the app.
            </p>
          </div>
          <TownshipLine className="mt-12 max-w-4xl" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {lines.map(({ name, english, icon: Icon, tint, body, example }) => (
              <li key={name} className="bb-card flex flex-col p-5">
                <span aria-hidden="true" className={cn("grid size-11 place-items-center rounded-lg", tint)}>
                  <Icon className="size-5 text-ink" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold text-ink">{name}</h3>
                <p className="font-bold text-ink-muted">{english}</p>
                <p className="mt-3 text-ink">{body}</p>
                <p className="mt-auto pt-5">
                  <span className="inline-flex rounded-full bg-sun-tint px-3 py-1 text-sm font-bold text-ink">{example}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-muted">Example values. Each township sets its own rules and caps.</p>
        </section>

        {/* Verified loop */}
        <section className="border-y border-hairline bg-surface">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:py-20">
            <div>
              <p className="text-eyebrow text-ink-muted">Points stay honest</p>
              <h2 className="text-display-lg mt-2 text-ink">Only verified actions count</h2>
              <p className="mt-4 text-ink-muted">
                A loan needs both sides to confirm. An event needs a staff-scanned check-in. Help needs the neighbour&apos;s thanks. Nothing is earned by scrolling.
              </p>
            </div>
            <ol className="relative grid gap-6 md:grid-cols-5 md:gap-4">
              <span aria-hidden="true" className="absolute top-[13px] right-[10%] left-[10%] hidden h-1.5 rounded-full bg-lilac md:block" />
              {marketingContent.loop.map((step, index) => (
                <li key={step} className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative grid size-8 shrink-0 place-items-center rounded-full border-[3px] border-ink text-xs font-bold",
                      index === 2 ? "bg-coral text-ink" : "bg-surface text-ink"
                    )}
                  >
                    {index + 1}
                  </span>
                  <p className="font-bold text-ink md:mt-2">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Township offices */}
        <section id="townships" className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <p className="text-eyebrow text-ink-muted">For township offices</p>
            <h2 className="text-display-lg mt-2 text-ink lg:text-5xl lg:leading-[1.05]">See participation, never people</h2>
            <p className="mt-4 text-lg text-ink-muted">
              Township Pulse shows which lines are active, which neighbourhoods need an event, and what the rewards economy costs, in aggregate only.
            </p>
            <ul className="mt-6 flex flex-col gap-4">
              {[
                { icon: EyeOffIcon, text: "No unit labels, private messages or a named resident's activity, ever." },
                { icon: ScaleIcon, text: "Breakdowns under five residents are suppressed so nobody can be singled out." },
                { icon: BadgeCheckIcon, text: "Impact figures are labelled as estimates, with the method published." },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-mint-tint">
                    <Icon className="size-5 text-ink" strokeWidth={1.8} />
                  </span>
                  <span className="pt-1.5 text-ink">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bb-card p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-title text-ink">Participation by township line</p>
              <DemoLabel />
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              {pulseBars.map((row) => (
                <li key={row.name} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
                  <span className="font-bold text-ink">{row.name}</span>
                  <span aria-hidden="true" className="h-5 overflow-hidden rounded-md bg-ground">
                    <span className={cn("block h-full rounded-md", row.bar)} style={{ width: `${row.value}%` }} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-lg bg-ink p-4 text-sm text-surface">
              <p className="text-eyebrow text-band-eyebrow">Privacy safeguard</p>
              <p className="mt-1">This view shows aggregates only.</p>
            </div>
          </div>
        </section>

        {/* Sponsors */}
        <section id="sponsors" className="scroll-mt-20 bg-sun-tint">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
            <div className="lg:order-2">
              <p className="text-eyebrow text-ink">For sponsors</p>
              <h2 className="text-display-lg mt-2 text-ink lg:text-5xl lg:leading-[1.05]">Fund rewards neighbours actually earned</h2>
              <p className="mt-4 text-lg text-ink">
                Local cafés and shops fund vouchers and challenges. Residents redeem them with BetterPoints from verified activity. You see redemption counts, not customers.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-4 lg:order-1">
              {[
                { partner: "Kopi Kita", title: "RM5 drink voucher", cost: 300, tint: "bg-coral-tint" },
                { partner: "Township office", title: "Free hall booking hour", cost: 800, tint: "bg-lilac-tint" },
              ].map((reward) => (
                <li key={reward.title} className="bb-card overflow-hidden">
                  <div aria-hidden="true" className={cn("grid aspect-[4/3] place-items-center", reward.tint)}>
                    <ShieldCheckIcon className="size-10 text-ink" strokeWidth={1.4} />
                  </div>
                  <div className="p-4">
                    <p className="text-eyebrow text-ink-muted">{reward.partner}</p>
                    <p className="text-title mt-1 text-ink">{reward.title}</p>
                    <p className="mt-1 text-sm text-ink-muted tabular-nums">{reward.cost} BP</p>
                  </div>
                </li>
              ))}
              <li className="col-span-2"><DemoLabel /></li>
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="bb-band flex flex-col items-start gap-6 rounded-band p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-balance text-surface sm:text-4xl">{marketingContent.tagline}</h2>
              <p className="mt-3 max-w-[52ch] text-band-eyebrow">Join with your township&apos;s code. It takes a minute, and your unit label stays private.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/sign-up" />} variant="cta" size="cta">{localized.signUp}</Button>
              <Button render={<Link href="/sign-in?next=/home" />} variant="outline" size="cta">{marketingContent.secondaryAction}</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p><span className="font-display font-extrabold text-ink">BorrowBetter</span> · {localized.tagline}</p>
          <p>Prototype for a university hackathon. No real brands or people.</p>
        </div>
      </footer>
    </div>
  )
}

/** Illustrative app preview built from the real components, with fictional content. */
function HeroPreview({ demo }: { demo: boolean }) {
  return (
    <div className="mx-auto w-full max-w-md lg:max-w-none">
      <div className="relative">
      <div className="relative rounded-[28px] bg-surface p-4 shadow-raised sm:p-5 lg:ml-8">
        <div className="rounded-[20px] bg-ink px-4 pt-5 pb-6">
          <p className="text-eyebrow text-band-eyebrow">Harmoni Heights</p>
          <p className="mt-2 font-display text-2xl leading-tight font-extrabold text-surface">Selamat petang, Nurul</p>
          <p className="mt-2 text-sm text-band-eyebrow">
            160 BP from <strong className="text-sun">Level 4 · Jiran Mesra</strong>
          </p>
          <TownshipLine tone="ink" current="Tolong" details={{ Pinjam: "11 loans", Jom: "6 events", Tolong: "Next stop", Rimba: "2 goals" }} className="mt-5" />
        </div>
        <div className="mt-4 rounded-lg bg-coral-tint p-3">
          <p className="font-bold text-ink">Return the cordless drill</p>
          <p className="text-sm text-ink-muted">By Sun · Lobby B</p>
        </div>
        <ul className="mt-3 divide-y divide-hairline rounded-lg border border-hairline">
          <ActivityRow title="Drill returned and confirmed" detail="Pinjam · Yesterday" delta={40} />
          <ActivityRow title="Checked in at Repair café" detail="Jom · Sun" delta={50} />
        </ul>
      </div>
      <BetterPointsChip balance={1240} className="absolute -top-4 right-4 shadow-raised lg:-right-2" />
      <p className="absolute -bottom-4 left-0 flex items-center gap-2 rounded-full bg-mint px-3 py-2 text-sm font-bold text-ink shadow-raised lg:-left-2">
        <BadgeCheckIcon aria-hidden="true" className="size-4" />
        Check-in verified
      </p>
      </div>
      <p className="mt-8 text-center text-xs text-band-eyebrow lg:ml-8">
        Illustrative preview{demo ? " · demo data" : ""}. Names and numbers are fictional.
      </p>
    </div>
  )
}
