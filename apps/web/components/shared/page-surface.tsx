"use client"

import { usePathname } from "next/navigation"

const fullBleedRoutes = [
  /^\/home$/,
  /^\/rewards$/,
  /^\/borrow\/items\/[^/]+$/,
  /^\/events\/[^/]+\/ticket$/,
]

export function PageSurface({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const fullBleed = fullBleedRoutes.some((pattern) => pattern.test(pathname))

  if (fullBleed) return <>{children}</>
  return <div className="bb-standard-page">{children}</div>
}
