"use client"

import dynamic from "next/dynamic"

const NeighbourhoodMap = dynamic(
  () => import("@/components/map/neighbourhood-map").then((module) => module.NeighbourhoodMap),
  {
    ssr: false,
    loading: () => <div className="h-[420px] animate-pulse rounded-xl bg-muted" />,
  }
)

export function LazyNeighbourhoodMap() {
  return <NeighbourhoodMap />
}
