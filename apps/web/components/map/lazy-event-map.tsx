"use client"

import dynamic from "next/dynamic"

const EventMap = dynamic(
  () => import("@/components/map/event-map").then((module) => module.EventMap),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-lg bg-lilac-tint sm:h-[22rem]" />,
  }
)

export function LazyEventMap(props: React.ComponentProps<typeof EventMap>) {
  return <EventMap {...props} />
}
