"use client"

import dynamic from "next/dynamic"

const NeighbourhoodMap = dynamic(
  () => import("@/components/map/neighbourhood-map").then((module) => module.NeighbourhoodMap),
  {
    ssr: false,
    loading: () => <div className="h-[28rem] animate-pulse rounded-lg bg-lilac-tint" />,
  }
)

export function LazyNeighbourhoodMap() {
  return <NeighbourhoodMap />
}
