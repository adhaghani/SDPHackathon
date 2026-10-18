"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

export function DeferredMap({
  children,
  placeholderClassName,
}: {
  children: ReactNode
  placeholderClassName: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!container.current) return
    if (!("IntersectionObserver" in window)) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={container}>
      {visible ? (
        children
      ) : (
        <div
          role="status"
          aria-label="Loading map"
          className={placeholderClassName}
        >
          <span className="sr-only">The map loads as you scroll closer.</span>
        </div>
      )}
    </div>
  )
}
