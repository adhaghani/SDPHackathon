"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  initialPreviewState,
  parsePreviewState,
  type PreviewState,
} from "@/lib/judges/seed"

const key = "borrowlah-judges-v1"
export function usePreviewSession() {
  const [state, setState] = useState<PreviewState>(initialPreviewState)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    try {
      setState(parsePreviewState(sessionStorage.getItem(key)))
    } catch {
      /* Storage may be disabled; in-memory interactions still work. */
    }
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try {
      sessionStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* The current page remains interactive without persistence. */
    }
  }, [state, ready])
  function reset() {
    setState(structuredClone(initialPreviewState))
    toast.success("Demo reset", {
      description:
        "All seeded scenarios in this tab have been restored. No database was contacted.",
    })
  }
  function update(change: Partial<PreviewState>, message: string) {
    setState((previous) => ({ ...previous, ...change }))
    toast.success(message, {
      description: "Demo only · saved in this tab. No database connection.",
    })
  }
  return { state, setState, ready, reset, update }
}
export type PreviewSession = ReturnType<typeof usePreviewSession>
export function unavailable(action: string) {
  toast.info(`${action} is unavailable in this preview`, {
    description:
      "This judges demo is not connected to a database. Use borrowlah.my for the live app.",
    duration: 6500,
  })
}
