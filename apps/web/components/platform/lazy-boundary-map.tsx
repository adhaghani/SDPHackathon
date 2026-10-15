"use client"

import dynamic from "next/dynamic"

export const LazyBoundaryMap = dynamic(
  () => import("./boundary-map").then((m) => m.BoundaryMap),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="flex h-[28rem] items-center justify-center rounded-xl border border-hairline bg-muted text-sm sm:h-[34rem]"
      >
        Loading interactive map…
      </div>
    ),
  }
)
