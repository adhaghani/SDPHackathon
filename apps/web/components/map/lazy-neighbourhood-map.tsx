"use client"

import dynamic from "next/dynamic"
import { DeferredMap } from "@/components/map/deferred-map"

const NeighbourhoodMap = dynamic(
  () => import("@/components/map/neighbourhood-map").then((module) => module.NeighbourhoodMap),
  {
    ssr: false,
    loading: () => <div className="h-[28rem] animate-pulse rounded-lg bg-lilac-tint" />,
  }
)

export function LazyNeighbourhoodMap() {
  return (
    <DeferredMap placeholderClassName="h-[28rem] rounded-lg bg-lilac-tint">
      <NeighbourhoodMap />
    </DeferredMap>
  )
}
