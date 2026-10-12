import Link from "next/link"

import { TownshipLine } from "@/components/shared/township-line"
import { authContent } from "@/content/auth"
import { marketingContent } from "@/content/marketing"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-surface"
      >
        Skip to content
      </a>
      <aside className="bb-band bb-safe-top flex flex-col rounded-b-band px-5 pt-6 pb-8 sm:px-8 lg:sticky lg:top-0 lg:h-svh lg:rounded-none lg:rounded-r-band lg:px-12 lg:py-10">
        <Link href="/" className="w-fit font-display text-xl font-extrabold text-surface">
          {authContent.brand}
        </Link>
        <div className="mt-6 lg:mt-auto">
          <p className="font-display text-[28px] leading-tight font-extrabold text-balance text-surface sm:text-4xl lg:text-5xl">
            {authContent.tagline}
          </p>
          <p className="mt-3 max-w-[48ch] text-band-eyebrow max-lg:hidden">
            Borrow and lend, join neighbourhood events and help nearby residents. Recognition comes only from verified activity.
          </p>
        </div>
        <TownshipLine
          tone="ink"
          current="Tolong"
          details={Object.fromEntries(marketingContent.stops.map((stop) => [stop.line, stop.label]))}
          className="mt-8 max-lg:hidden lg:mt-12 lg:mb-auto"
        />
      </aside>
      <main id="main-content" className="flex items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:py-12">
        <section className="bb-card w-full max-w-md p-5 sm:p-7">{children}</section>
      </main>
    </div>
  )
}
