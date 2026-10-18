"use client"

import Link from "next/link"
import { useState, type ComponentProps } from "react"

/** Avoid a viewport full of authenticated prefetches during the initial load. */
export function IntentLink({
  onPointerEnter,
  onFocus,
  prefetch,
  ...props
}: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false)
  return (
    <Link
      {...props}
      prefetch={prefetch ?? intent}
      onPointerEnter={(event) => {
        setIntent(true)
        onPointerEnter?.(event)
      }}
      onFocus={(event) => {
        setIntent(true)
        onFocus?.(event)
      }}
    />
  )
}
