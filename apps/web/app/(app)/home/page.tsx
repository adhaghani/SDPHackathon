import Link from "next/link"
import { Suspense } from "react"

import { IntentComposer } from "@/components/block/intent-composer"
import { Sheet } from "@/components/block/layout"
import { BetterPointsChip } from "@/components/shared/better-points-chip"
import {
  HomeTasks,
  HomeFeed,
  HomeSavedItems,
  HomeRecyclingImpact,
  HomeRecyclingGoal,
  HomeSectionLoading,
} from "@/components/home/sections"
import { malayGreeting } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"

export default async function HomePage() {
  const active = await requireActiveMember()
  const now = new Date()
  const firstName = active.profile?.display_name?.split(" ")[0] ?? "neighbour"
  const townshipName = active.membership.townships?.name ?? "Your township"
  const blockName = "Your block"
  const balance = active.points?.balance ?? 0

  return (
    <div className="-mx-4 overflow-hidden rounded-none bg-lime text-ink sm:-mx-6 md:mx-0 md:rounded-[32px]">
      <div className="px-5 pt-5 pb-8 sm:px-7 md:px-10 md:pt-8">
        <header className="flex items-center justify-between gap-3 pr-14 md:pr-0">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full bg-ink"
            />
            <span className="truncate text-sm font-semibold">
              {blockName} · {townshipName}
            </span>
          </div>
          <BetterPointsChip balance={balance} />
        </header>

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
          <h1 className="text-hero text-balance">
            {malayGreeting(
              new Date(
                now.toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
              )
            )}
            , {firstName}.<br />
            What&apos;s up today?
          </h1>
          <IntentComposer />
        </section>
      </div>

      <Sheet className="min-h-[420px] rounded-b-none px-5 pt-6 pb-8 sm:px-7 md:px-10 md:pt-8">
        <Suspense fallback={<HomeSectionLoading label="Your next step" />}>
          <HomeTasks />
        </Suspense>
        <div className="mt-8 flex items-baseline justify-between gap-3">
          <h2 className="text-h2">Near you, right now</h2>
        </div>
        <Suspense fallback={<HomeSectionLoading label="Nearby activity" />}>
          <HomeFeed now={now.toISOString()} />
        </Suspense>
        <Suspense fallback={<HomeSectionLoading label="Saved items" />}>
          <HomeSavedItems />
        </Suspense>
        <p className="mt-4 text-sm text-ink-soft">
          BetterPoints are awarded after the required confirmation, subject to
          the township reward rules and daily or weekly caps. Requesting or
          approving a loan earns no points.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)] lg:items-start">
          <Suspense
            fallback={<HomeSectionLoading label="Your recycling impact" />}
          >
            <HomeRecyclingImpact />
          </Suspense>
          <Suspense
            fallback={<HomeSectionLoading label="Township recycling goal" />}
          >
            <HomeRecyclingGoal />
          </Suspense>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/borrow"
            className="rounded-[20px] bg-sky p-4 text-sm font-bold text-ink"
          >
            Browse all PINJAM items <span aria-hidden="true">›</span>
          </Link>
          <Link
            href="/events"
            className="rounded-[20px] bg-lime p-4 text-sm font-bold text-ink"
          >
            See what&apos;s happening <span aria-hidden="true">›</span>
          </Link>
          <Link
            href="/giveaway"
            className="rounded-[20px] bg-mustard p-4 text-sm font-bold text-ink"
          >
            Pass something on <span aria-hidden="true">›</span>
          </Link>
          <Link
            href="/community"
            className="rounded-[20px] bg-mint-tint p-4 text-sm font-bold text-ink"
          >
            Lend a hand nearby <span aria-hidden="true">›</span>
          </Link>
        </div>

        <p className="mt-5 text-xs text-ink-soft">
          Listings and events are township data. Walking distances are not
          available yet.
        </p>
      </Sheet>
    </div>
  )
}
