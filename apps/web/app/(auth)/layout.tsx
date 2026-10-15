import { BrandLogo } from "@/components/shared/brand-logo"
import Link from "next/link"

import { PillarStrip } from "@/components/block/pillar-strip"
import { authContent } from "@/content/auth"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh bg-lime lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
      >
        Skip to content
      </a>
      <aside className="bb-safe-top flex flex-col px-6 pt-6 pb-8 text-ink sm:px-10 lg:sticky lg:top-0 lg:h-svh lg:px-12 lg:py-10 xl:px-16">
        <Link
          href="/"
          className="inline-flex min-h-11 w-fit items-center font-display text-2xl font-extrabold text-ink"
        >
          <BrandLogo className="w-48" />
        </Link>
        <div className="mt-5 lg:my-auto lg:py-12">
          <p className="max-w-[14ch] font-display text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance text-ink sm:text-4xl lg:text-5xl xl:text-6xl">
            {authContent.tagline}
          </p>
          <p className="mt-6 max-w-[36ch] text-base leading-relaxed text-ink-soft max-lg:hidden">
            Borrow and lend, join neighbourhood events and help nearby
            residents. Recognition comes only from verified activity.
          </p>
          <PillarStrip className="mt-8 max-lg:hidden" />
        </div>
      </aside>
      <main
        id="main-content"
        tabIndex={-1}
        className="bb-safe-bottom flex items-start justify-center rounded-t-4xl bg-white px-6 py-9 sm:px-10 sm:py-12 lg:min-h-svh lg:items-center lg:rounded-t-none lg:rounded-l-4xl lg:px-12"
      >
        <section className="w-full max-w-[440px]">{children}</section>
      </main>
    </div>
  )
}
