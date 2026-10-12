import Link from "next/link"
import type { ReactNode } from "react"

import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

const routes = [
  { href: "/home", label: "Home", detail: "Your next stop", art: "home" },
  { href: "/borrow", label: "Borrow", detail: "Things to share", art: "borrow" },
  { href: "/events", label: "Events", detail: "Meet nearby", art: "events" },
] as const

export function StatusPage({
  code,
  title,
  description,
  action,
}: {
  code: string
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <main className="bb-on-ink min-h-svh overflow-hidden bg-ink text-surface">
      <div className="mx-auto flex min-h-svh max-w-[1600px] flex-col px-5 py-7 sm:px-8 sm:py-10 lg:px-14">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-white" />
          {code}
        </p>

        <section className="mt-12 max-w-5xl sm:mt-20">
          <p className="font-display text-5xl leading-none font-bold text-white/30 sm:text-7xl">Oops!</p>
          <h1 className="mt-3 max-w-5xl font-display text-4xl leading-[1.02] font-bold text-white sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-band-eyebrow sm:text-lg">{description}</p>
          <div className="mt-7">{action}</div>
        </section>

        <section aria-label="Quick routes" className="mt-auto grid gap-4 pt-16 md:grid-cols-3 md:gap-5">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-5 transition-colors hover:border-lilac/60 hover:bg-white/[0.09] sm:min-h-[360px] sm:p-6"
            >
              <RouteArt variant={route.art} />
              <div className="relative flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold text-white">{route.label}</p>
                  <p className="mt-1 text-sm text-band-eyebrow">{route.detail}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform group-hover:rotate-6">
                  <ArrowUpRightIcon aria-hidden="true" className="size-5" />
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}

function RouteArt({ variant }: { variant: "home" | "borrow" | "events" }) {
  if (variant === "home") {
    return (
      <div aria-hidden="true" className="relative grid h-40 place-items-center sm:h-56">
        <span className="absolute size-40 rounded-full border border-white/20 sm:size-56" />
        <span className="absolute size-28 rounded-full border border-lilac/80 sm:size-40" />
        <span className="absolute size-10 rounded-full bg-lilac sm:size-14" />
      </div>
    )
  }

  if (variant === "borrow") {
    return (
      <div aria-hidden="true" className="relative h-40 overflow-hidden sm:h-56">
        <span className="absolute top-10 left-1/2 h-px w-4/5 -translate-x-1/2 rotate-[-8deg] rounded-full bg-white/20" />
        <span className="absolute top-24 left-1/2 h-px w-4/5 -translate-x-1/2 rotate-[-8deg] rounded-full bg-white/20" />
        <span className="absolute top-40 left-1/2 h-1 w-4/5 -translate-x-1/2 -rotate-6 rounded-full bg-lilac" />
        <span className="absolute top-56 left-1/2 h-px w-4/5 -translate-x-1/2 -rotate-6 rounded-full bg-white/20" />
      </div>
    )
  }

  return (
    <div aria-hidden="true" className="relative h-40 sm:h-56">
      <span className="absolute top-6 right-8 size-16 rounded-full border-2 border-lilac sm:size-20" />
      <span className="absolute top-24 right-24 size-14 bg-lilac sm:size-16" />
      <span className="absolute top-36 left-14 size-14 border-2 border-white/20 sm:size-16" />
      <span className="absolute bottom-4 left-32 size-12 border-2 border-white/20 sm:size-14" />
    </div>
  )
}
