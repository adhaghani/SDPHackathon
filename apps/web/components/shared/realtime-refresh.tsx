"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { getBrowserClient } from "@/lib/supabase/browser"

export function RealtimeRefresh({
  table,
  filter,
}: {
  table: "notifications" | "booking_messages"
  filter?: string
}) {
  const router = useRouter()

  useEffect(() => {
    const channel = getBrowserClient()
      .channel(`${table}-refresh-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      void getBrowserClient().removeChannel(channel)
    }
  }, [filter, router, table])

  return null
}
