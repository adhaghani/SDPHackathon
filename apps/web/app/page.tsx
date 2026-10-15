import { BrandLogo } from "@/components/shared/brand-logo"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import styles from "./landing.module.css"
import {
  ArrowDownIcon,
  ArrowDownRightIcon,
  ArrowUpIcon,
  MoveHorizontalIcon,
  SearchIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckIcon,
  GiftIcon,
  HandHelpingIcon,
  LeafIcon,
  PackageIcon,
  QrCodeIcon,
  RecycleIcon,
  ShieldCheckIcon,
  SproutIcon,
  UsersIcon,
} from "lucide-react"

import { DemoRoleSwitcher } from "@/components/demo/demo-role-switcher"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { isDemoMode, isFeatureEnabled } from "@/lib/env"
import { getPreferredLocale } from "@/lib/i18n"
import { copy } from "@/lib/i18n-copy"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export const metadata: Metadata = {
  title: "BorrowLah · A greener township starts with us",
  description:
    "Reduce, reuse, and recycle with your neighbours. Borrow everyday items, give things a second life, track recycling, and connect your township with events, help, guest passes, and rewards.",
}

export default async function Page() {
  const locale = isFeatureEnabled("bm_ui") ? await getPreferredLocale() : "en"
  const localized = copy[locale]
  const t = (en: string, ms: string) => (locale === "ms" ? ms : en)
  const pillars = [
    {
      name: "Reduce",
      ms: "Kurangkan",
      href: "/borrow",
      icon: PackageIcon,
      tint: "bg-sky",
      title: t("Need it once? Borrow it.", "Perlu sekali? Pinjam sahaja."),
      body: t(
        "A drill for the weekend. A ladder for an afternoon. Share what already exists nearby and skip a purchase you don’t need.",
        "Gerudi untuk hujung minggu. Tangga untuk petang ini. Kongsi barang yang sudah ada berdekatan dan elakkan pembelian yang tidak perlu."
      ),
      feature: t("Borrow & lend · PINJAM", "Pinjam & kongsi · PINJAM"),
    },
    {
      name: "Reuse",
      ms: "Guna semula",
      href: "/giveaway",
      icon: GiftIcon,
      tint: "bg-mustard",
      title: t(
        "Done with it? Pass it on.",
        "Tidak perlu lagi? Beri kepada jiran."
      ),
      body: t(
        "Your spare chair could be someone’s missing piece. Give useful things a second home, and join repair cafés and swap events.",
        "Kerusi lebihan anda mungkin diperlukan orang lain. Beri barang berguna rumah baharu, dan sertai acara membaiki dan bertukar barang."
      ),
      feature: t("Giveaways & community events", "Pemberian & acara komuniti"),
    },
    {
      name: "Recycle",
      ms: "Kitar semula",
      href: "/recycling",
      icon: RecycleIcon,
      tint: "bg-lime",
      title: t("Sort it. Log it. Keep going.", "Asingkan. Catat. Teruskan."),
      body: t(
        "Record your recycling drop-offs, explore estimated material and energy savings, and contribute to your township’s shared recycling goal.",
        "Catat penghantaran kitar semula, lihat anggaran penjimatan bahan dan tenaga, dan sumbang kepada sasaran kitar semula perbandaran."
      ),
      feature: t(
        "Recycling logs & shared goals",
        "Rekod kitar semula & sasaran bersama"
      ),
    },
  ]
  const features = [
    {
      icon: PackageIcon,
      name: "PINJAM",
      title: t(
        "Less buying. More sharing.",
        "Kurang membeli. Lebih berkongsi."
      ),
      body: t(
        "Find items nearby, request a loan, and confirm the handover and return together.",
        "Cari barang berdekatan, mohon pinjaman, dan sahkan penyerahan serta pemulangan bersama."
      ),
      tint: "bg-sky",
    },
    {
      icon: CalendarDaysIcon,
      name: "JOM",
      title: t("Meet the people next door.", "Kenali jiran anda."),
      body: t(
        "Discover clean-ups, swap markets, and neighbourhood events with QR check-in.",
        "Temui gotong-royong, pasar pertukaran, dan acara kejiranan dengan daftar masuk QR."
      ),
      tint: "bg-lime",
    },
    {
      icon: HandHelpingIcon,
      name: "TOLONG",
      title: t(
        "A little help goes a long way.",
        "Sedikit bantuan, besar maknanya."
      ),
      body: t(
        "Ask for a helping hand or offer one, from carrying groceries to watering plants.",
        "Minta atau tawarkan bantuan, daripada membawa barangan dapur hingga menyiram tanaman."
      ),
      tint: "bg-mustard",
    },
    {
      icon: QrCodeIcon,
      name: t("GUEST ACCESS", "AKSES TETAMU"),
      title: t(
        "Welcome guests with less fuss.",
        "Sambut tetamu dengan lebih mudah."
      ),
      body: t(
        "Create time-limited QR visitor passes, manage approvals, and support guard check-in.",
        "Cipta pas pelawat QR bertempoh, urus kelulusan, dan bantu daftar masuk pengawal."
      ),
      tint: "bg-paper",
    },
    {
      icon: SproutIcon,
      name: "RIMBA",
      title: t("Make progress together.", "Maju bersama-sama."),
      body: t(
        "Track recycling, join challenges, and work toward a shared block goal.",
        "Jejaki kitar semula, sertai cabaran, dan capai sasaran blok bersama."
      ),
      tint: "bg-lime",
    },
    {
      icon: GiftIcon,
      name: "BETTERPOINTS",
      title: t("Good actions, recognised.", "Sumbangan baik, dihargai."),
      body: t(
        "Earn points for eligible, verified contributions and redeem available local rewards.",
        "Kumpul mata untuk sumbangan layak yang disahkan dan tebus ganjaran tempatan yang tersedia."
      ),
      tint: "bg-sky",
    },
  ]

  return (
    <div className={cn(styles.landing, "min-h-svh bg-paper text-ink")}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-3 focus:text-white"
      >
        {t("Skip to content", "Langkau ke kandungan")}
      </a>
      <header className="bb-safe-top sticky top-0 z-40 border-b border-ink/10 bg-paper">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg font-extrabold sm:text-2xl"
          >
            <BrandLogo className="w-36 sm:w-44" />
          </Link>
          <nav
            aria-label={t("Sections", "Bahagian")}
            className="hidden items-center gap-1 lg:flex"
          >
            {[
              ["#how", t("The 3R way", "Cara 3R")],
              ["#features", t("Township life", "Kehidupan perbandaran")],
              ["#townships", t("Our shared impact", "Impak bersama")],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-4 py-3 text-sm font-bold transition-colors hover:bg-lime"
              >
                {label}
              </a>
            ))}
          </nav>
          <nav
            aria-label={t("Account", "Akaun")}
            className="flex items-center gap-1 sm:gap-3"
          >
            {isFeatureEnabled("bm_ui") ? (
              <LanguageSwitcher
                current={locale}
                next={locale === "en" ? "ms" : "en"}
                label={localized.switchLanguage}
                nextPath="/"
                compact
              />
            ) : null}
            <Button render={<Link href="/sign-in" />} variant="ghost" size="sm">
              {localized.signIn}
            </Button>
            <Button
              render={<Link href="/sign-up" />}
              variant="outline"
              className="hidden sm:inline-flex"
            >
              {t("Join your township", "Sertai perbandaran")}
            </Button>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className={cn(styles.hero, "relative overflow-hidden")}>
          <div className="mx-auto grid max-w-7xl gap-6 px-5 pt-12 pb-14 sm:px-8 sm:pt-16 lg:grid-cols-[1fr_1.12fr] lg:items-center lg:gap-2 lg:pt-16 lg:pb-20">
            <div>
              <h1 className={styles.heroTitle}>
                <span>{t("A better", "Blok lebih")}</span>
                <span>
                  {t("block.", "baik.")}{" "}
                  <SproutIcon
                    aria-hidden="true"
                    className={styles.titleSprout}
                    strokeWidth={1.3}
                  />
                </span>
                <span className={styles.heroAccent}>
                  {t("A greener", "Bumi lebih")}
                </span>
                <span>{t("planet.", "hijau.")}</span>
              </h1>
              <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-ink-soft sm:text-lg">
                {t(
                  "What if the things we share could change the place we call home? Reduce waste, reuse what’s useful, and recycle together—with your whole township in one app.",
                  "Bagaimana jika perkongsian kita dapat mengubah tempat tinggal kita? Kurangkan sisa, guna semula barang berguna, dan kitar semula bersama—seluruh perbandaran dalam satu aplikasi."
                )}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  render={<Link href="/sign-up" />}
                  variant="cta"
                  size="cta"
                >
                  {t("Join your township", "Sertai perbandaran")}
                  <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
                <Button
                  render={<Link href="/sign-in?next=/home" />}
                  variant="outline"
                  size="cta"
                >
                  {t("Explore the app", "Terokai aplikasi")}
                </Button>
              </div>
              <p className="mt-4 text-sm text-ink-soft">
                {t(
                  "Free for residents. Built for Malaysian neighbourhoods.",
                  "Percuma untuk penduduk. Dibina untuk kejiranan Malaysia."
                )}
              </p>
            </div>
            <TownshipIllustration
              label={t(
                "One neighbourhood. More possibilities.",
                "Satu kejiranan. Lebih banyak peluang."
              )}
              caption={t(
                "Share more. Waste less. Grow together.",
                "Lebih berkongsi. Kurang membazir. Maju bersama."
              )}
            />
          </div>
        </section>

        <div className="border-y border-ink/15 bg-lime">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-5 sm:px-8">
            <p className="text-sm font-bold">
              {t(
                "GOOD FOR YOUR BLOCK. BETTER FOR NATURE.",
                "BAIK UNTUK BLOK ANDA. LEBIH BAIK UNTUK ALAM."
              )}
            </p>
            <p className="flex flex-wrap gap-x-6 gap-y-2 font-display text-lg font-bold">
              <span className="flex items-center gap-2">
                <ArrowDownRightIcon aria-hidden="true" className="size-5" />
                {t("Less waste", "Kurang sisa")}
              </span>
              <span className="flex items-center gap-2">
                <ArrowUpIcon aria-hidden="true" className="size-5" />
                {t("More life", "Lebih hayat")}
              </span>
              <span className="flex items-center gap-2">
                <MoveHorizontalIcon aria-hidden="true" className="size-5" />
                {t("Closer neighbours", "Jiran lebih rapat")}
              </span>
            </p>
          </div>
        </div>

        <section
          id="how"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24"
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h2 className="mt-3 max-w-[19ch] font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
                {t(
                  "Less in the bin. More in the neighbourhood.",
                  "Kurang dalam tong. Lebih untuk kejiranan."
                )}
              </h2>
            </div>
            <p className="max-w-sm text-lg text-ink-soft">
              {t(
                "Sustainable living starts closer than you think. Often, just a few doors away.",
                "Kehidupan lestari bermula lebih dekat daripada yang anda sangka. Mungkin hanya beberapa pintu sahaja."
              )}
            </p>
          </div>
          <div className={styles.pillars}>
            {pillars.map(
              ({ name, ms, href, icon: Icon, tint, title, body, feature }) => (
                <article key={name} className={styles.pillar}>
                  <div
                    className={cn(styles.pillarArt, tint)}
                    aria-hidden="true"
                  >
                    <span className={styles.pillarOrbit} />
                    <Icon className={styles.pillarSymbol} strokeWidth={1.1} />
                    <span className={styles.pillarWord}>{name}</span>
                  </div>
                  <div className="px-1 pt-6">
                    <h3 className="font-display text-3xl font-extrabold tracking-tight">
                      {locale === "ms" ? ms : name}
                      <span aria-hidden="true">.</span>
                    </h3>
                    <p className="mt-3 text-lg font-bold">{title}</p>
                    <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
                  </div>
                  <Link
                    href={`/sign-in?next=${href}`}
                    className={styles.pillarLink}
                  >
                    <span>{feature}</span>
                    <ArrowUpRightIcon
                      aria-hidden="true"
                      className="size-5 shrink-0"
                    />
                  </Link>
                </article>
              )
            )}
          </div>
        </section>

        <section className="on-dark overflow-hidden bg-ink text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20 lg:py-20">
            <div>
              <LeafIcon
                aria-hidden="true"
                className="size-10 text-lime"
                strokeWidth={1.5}
              />
              <h2 className="mt-3 font-display text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl">
                {t(
                  "Keep useful things in circulation.",
                  "Pastikan barang berguna terus digunakan."
                )}
                <br />
                <span className="text-lime">
                  {t(
                    "Give nature a little breathing room.",
                    "Beri alam ruang untuk bernafas."
                  )}
                </span>
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-on-dark-muted">
                {t(
                  "Every item shared is a chance to avoid an unnecessary purchase. Every giveaway extends a useful life. Every material recycled helps keep resources in use and waste out of our surroundings.",
                  "Setiap barang dikongsi membuka peluang mengelakkan pembelian yang tidak perlu. Setiap pemberian memanjangkan hayat barang. Setiap bahan dikitar semula membantu mengekalkan sumber dan mengurangkan sisa di persekitaran."
                )}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/20 p-6 sm:p-8">
              <p className="text-eyebrow text-on-dark-muted">
                {t(
                  "ONE DRILL. MANY WEEKEND PROJECTS.",
                  "SATU GERUDI. BANYAK PROJEK HUJUNG MINGGU."
                )}
              </p>
              <div
                aria-hidden="true"
                className="my-8 flex items-center justify-between gap-3"
              >
                <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sky text-ink sm:size-20">
                  <PackageIcon className="size-9" strokeWidth={1.5} />
                </span>
                <span className="h-px flex-1 bg-lime" />
                <RecycleIcon className="size-10 shrink-0 text-lime" />
                <span className="h-px flex-1 bg-lime" />
                <span className="grid size-16 shrink-0 place-items-center rounded-full bg-lime text-ink sm:size-20">
                  <UsersIcon className="size-9" strokeWidth={1.5} />
                </span>
              </div>
              <ol className="flex flex-col gap-4">
                {[
                  t(
                    "Borrow what you need from a neighbour.",
                    "Pinjam barang yang diperlukan daripada jiran."
                  ),
                  t(
                    "Use it, return it, and confirm together.",
                    "Guna, pulangkan, dan sahkan bersama."
                  ),
                  t(
                    "The next neighbour gets their turn.",
                    "Jiran seterusnya mendapat giliran."
                  ),
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-lime">
                      {i + 1}
                    </span>
                    <span className="text-on-dark-muted">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-7 border-t border-white/20 pt-5 font-display text-xl font-bold text-lime">
                {t(
                  "More use from what we already have.",
                  "Lebih manfaat daripada barang sedia ada."
                )}
              </p>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24"
        >
          <div className="mt-3 grid gap-5 lg:grid-cols-2 lg:gap-16">
            <h2 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
              {t(
                "Greener living. And everything around it.",
                "Kehidupan lebih hijau. Dan segala di sekelilingnya."
              )}
            </h2>
            <p className="max-w-lg text-lg leading-relaxed text-ink-soft">
              {t(
                "A thriving township needs more than a recycling bin. BorrowLah brings the everyday things that make a community work into one shared place.",
                "Perbandaran yang maju memerlukan lebih daripada tong kitar semula. BorrowLah menyatukan urusan harian yang menghidupkan komuniti dalam satu tempat."
              )}
            </p>
          </div>
          <div className={styles.productLayout}>
            <ProductPreview t={t} />
            <div className="grid gap-x-8 sm:grid-cols-2">
              {features.map(({ icon: Icon, name, title, body, tint }) => (
                <article key={name} className="border-t border-ink/20 py-7">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full",
                        tint
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <p className="text-sm font-bold tracking-wide">{name}</p>
                  </div>
                  <h3 className="mt-4 font-display text-xl leading-tight font-bold">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="townships"
          className="scroll-mt-24 border-y border-ink/10 bg-white"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-20">
            <div>
              <h2 className="mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
                {t(
                  "See the difference we make together.",
                  "Lihat perubahan yang kita cipta bersama."
                )}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                {t(
                  "Residents can follow their contributions and shared goals. Township offices see aggregate participation to support the community. Local sponsors can fund rewards for verified actions.",
                  "Penduduk boleh mengikuti sumbangan dan sasaran bersama. Pejabat perbandaran melihat penyertaan agregat untuk menyokong komuniti. Penaja tempatan boleh membiayai ganjaran untuk tindakan yang disahkan."
                )}
              </p>
              <a
                href="#start"
                className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold underline decoration-ink/30 underline-offset-4"
              >
                {t("Start with your block", "Mulakan dengan blok anda")}
                <ArrowDownIcon aria-hidden="true" className="size-4" />
              </a>
            </div>
            <ul className="flex flex-col gap-6">
              {[
                {
                  icon: CheckIcon,
                  title: t(
                    "Real actions, verified",
                    "Tindakan sebenar, disahkan"
                  ),
                  body: t(
                    "Loans and giveaways need handover confirmation. Events need a verified check-in. Eligible contributions earn BetterPoints under township rules.",
                    "Pinjaman dan pemberian memerlukan pengesahan penyerahan. Acara memerlukan daftar masuk yang disahkan. Sumbangan layak mendapat BetterPoints mengikut peraturan perbandaran."
                  ),
                },
                {
                  icon: LeafIcon,
                  title: t(
                    "Environmental estimates, explained",
                    "Anggaran alam sekitar, dijelaskan"
                  ),
                  body: t(
                    "Recycling logs translate material counts into estimated weight, CO₂e, and energy equivalents. Estimates help show progress; they are not measured environmental outcomes.",
                    "Rekod kitar semula menukar bilangan bahan kepada anggaran berat, CO₂e, dan tenaga. Anggaran menunjukkan kemajuan; ia bukan hasil alam sekitar yang diukur."
                  ),
                },
                {
                  icon: ShieldCheckIcon,
                  title: t(
                    "Community insight, with privacy",
                    "Wawasan komuniti, dengan privasi"
                  ),
                  body: t(
                    "Township impact views use aggregates, with small groups suppressed. Your unit label stays private and handovers happen in shared spaces.",
                    "Paparan impak perbandaran menggunakan agregat, dengan kumpulan kecil disembunyikan. Label unit anda kekal peribadi dan penyerahan berlaku di ruang bersama."
                  ),
                },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold">{title}</h3>
                    <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="start"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-20"
        >
          <div className="relative overflow-hidden rounded-[32px] bg-lime p-7 sm:p-12 lg:p-16">
            <SproutIcon
              aria-hidden="true"
              className="absolute right-8 bottom-0 hidden size-64 translate-y-12 rotate-[-15deg] text-ink/10 md:block"
              strokeWidth={1}
            />
            <div className="relative max-w-2xl">
              <h2 className="mt-4 font-display text-4xl leading-[1.03] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                {t(
                  "Your next good habit is just next door.",
                  "Tabiat baik anda yang seterusnya bermula di sebelah rumah."
                )}
              </h2>
              <p className="mt-5 max-w-lg text-lg text-ink-soft">
                {t(
                  "Join with your township’s code. Borrow something, share something, or show up for your community. Every small step has a place here.",
                  "Sertai dengan kod perbandaran anda. Pinjam, kongsi, atau hadir untuk komuniti. Setiap langkah kecil bermakna di sini."
                )}
              </p>
              <div className="mt-7">
                <Button
                  render={<Link href="/sign-up" />}
                  variant="default"
                  size="cta"
                  className="h-auto max-w-full py-3 whitespace-normal"
                >
                  {t(
                    "Let’s grow a better township",
                    "Bina perbandaran lebih baik"
                  )}
                  <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
              </div>
            </div>
          </div>
        </section>
        {isDemoMode() ? (
          <div className="mx-auto max-w-7xl px-5 pb-8 sm:px-8">
            <details
              open
              className="rounded-xl border border-ink/15 bg-white p-4"
            >
              <summary className="cursor-pointer text-sm font-bold">
                {t(
                  "Hackathon demo · explore resident, guard & admin roles",
                  "Demo hackathon · terokai peranan penduduk, pengawal & pentadbir"
                )}
              </summary>
              <div className="mt-4">
                <DemoRoleSwitcher />
              </div>
            </details>
          </div>
        ) : null}
      </main>
      <footer className="border-t border-ink/15">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center">
          <div>
            <Link href="/" className="font-display text-xl font-extrabold">
              <BrandLogo />
            </Link>
            <p className="mt-1 text-sm text-ink-soft">
              {t(
                "Share more. Waste less. Live better.",
                "Lebih berkongsi. Kurang membazir. Hidup lebih baik."
              )}
            </p>
          </div>
          <p className="max-w-sm text-sm text-ink-soft">
            {t(
              "Prototype for a university hackathon. Built around people, community, and the planet.",
              "Prototaip hackathon universiti. Dibina untuk penduduk, komuniti, dan bumi."
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}

function TownshipIllustration({
  label,
  caption,
}: {
  label: string
  caption: string
}) {
  return (
    <figure className={styles.garden}>
      <div className={styles.gardenImage}>
        <Image
          src="/images/township-garden.webp"
          alt=""
          width={1254}
          height={1254}
          sizes="(max-width: 1023px) 100vw, 55vw"
          preload
        />
      </div>
      <div className={styles.gardenNote}>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lime">
          <UsersIcon aria-hidden="true" className="size-5" />
        </span>
        <p>{label}</p>
      </div>
      <figcaption className={styles.gardenCaption}>
        <span className="size-2 shrink-0 rounded-full bg-ink" />
        {caption}
      </figcaption>
    </figure>
  )
}

function ProductPreview({ t }: { t: (en: string, ms: string) => string }) {
  return (
    <figure className={styles.productPreview}>
      <div className="flex items-center justify-between gap-3 text-sm text-on-dark-muted">
        <BrandLogo variant="dark" className="w-32" />
        <span>
          {t("Illustrative app preview", "Pratonton ilustrasi aplikasi")}
        </span>
      </div>
      <div className={styles.productScreen}>
        <div className="bg-lime p-5 sm:p-6">
          <p className="text-sm font-bold">
            {t("Welcome to your block", "Selamat datang ke blok anda")}
          </p>
          <p className="mt-2 font-display text-3xl leading-tight font-extrabold">
            {t("What do you need today?", "Apa yang anda perlukan hari ini?")}
          </p>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-ink-soft">
            <SearchIcon aria-hidden="true" className="size-4 shrink-0" />
            {t("A ladder, a helping hand…", "Tangga, bantuan jiran…")}
          </div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="mb-4 font-display text-xl font-bold">
            {t("Good things, close to home", "Perkara baik, dekat dengan anda")}
          </p>
          <div className="flex gap-4 border-b border-ink/10 pb-4">
            <Image
              src="/demo/item-drill.svg"
              alt=""
              width={88}
              height={88}
              className="size-[88px] rounded-xl object-cover"
            />
            <div className="py-1">
              <p className="text-xs font-bold tracking-wide">PINJAM</p>
              <p className="mt-1 font-bold">
                {t("Cordless drill", "Gerudi tanpa wayar")}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {t(
                  "For your next weekend project",
                  "Untuk projek hujung minggu"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-b border-ink/10 py-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-lime">
              <CalendarDaysIcon aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-wide">JOM</p>
              <p className="mt-1 font-bold">
                {t("Community garden day", "Hari kebun komuniti")}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {t(
                  "A little planting. A lot of good.",
                  "Sedikit menanam. Banyak manfaat."
                )}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 pt-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-mustard">
              <HandHelpingIcon aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-wide">TOLONG</p>
              <p className="mt-1 font-bold">
                {t(
                  "A hand with the groceries?",
                  "Bantuan membawa barang dapur?"
                )}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {t(
                  "Small favours. Stronger connections.",
                  "Bantuan kecil. Hubungan lebih erat."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-5 flex items-center gap-2 text-sm text-on-dark-muted">
        <ShieldCheckIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-lime"
        />
        {t(
          "Shared spaces. Real connections.",
          "Ruang bersama. Hubungan sebenar."
        )}
      </figcaption>
    </figure>
  )
}
