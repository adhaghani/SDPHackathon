"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getBrowserClient } from "@/lib/supabase/browser"
import { isRealtimeEnabled } from "@/lib/env"

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
    const channel = getBrowserClient()
      .channel(`${table}-refresh-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => router.refresh()
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          // Realtime is optional; pages continue to work with normal refreshes.
          void getBrowserClient().removeChannel(channel)
        }
      })

    return () => {
      void getBrowserClient().removeChannel(channel)
    }
  }, [filter, router, table])

  return null
}
