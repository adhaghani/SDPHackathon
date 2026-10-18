"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getBrowserClient } from "@/lib/supabase/browser"
import { isRealtimeEnabled } from "@/lib/env"

// All subscriptions using the same router share one refresh per 200 ms window.
const refreshes = new WeakMap<
  object,
  {
    subscribers: number
    timer?: ReturnType<typeof setTimeout>
  }
>()

export function RealtimeRefresh({
  table,
  filter,
}: {
  table: "notifications" | "booking_messages" | "points_ledger"
  filter?: string
}) {
  const router = useRouter()

  useEffect(() => {
    if (!isRealtimeEnabled()) return
    const pending = refreshes.get(router) ?? { subscribers: 0 }
    pending.subscribers += 1
    refreshes.set(router, pending)
    const channel = getBrowserClient()
      .channel(`${table}-refresh-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => {
          if (pending.timer) return
          pending.timer = setTimeout(() => {
            pending.timer = undefined
            router.refresh()
          }, 200)
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Realtime is optional; pages continue to work with normal refreshes.
          void getBrowserClient().removeChannel(channel)
        }
      })

    return () => {
      pending.subscribers -= 1
      if (!pending.subscribers) {
        clearTimeout(pending.timer)
        refreshes.delete(router)
      }
      void getBrowserClient().removeChannel(channel)
    }
  }, [filter, router, table])

  return null
}
