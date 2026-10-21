"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { JudgeRole } from "@/lib/judges/config"
import {
  initialPreviewState,
  parsePreviewState,
  type PreviewState,
} from "@/lib/judges/seed"

const key = "borrowlah-judges-v1"
export function usePreviewSession(role: JudgeRole) {
  const [state, setState] = useState<PreviewState>(initialPreviewState)
  const [ready, setReady] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  useEffect(() => {
    try {
      setState(parsePreviewState(sessionStorage.getItem(key)))
    } catch {
      setStorageAvailable(false)
    }
    setReady(true)
  }, [])
  useEffect(() => {
    if (!ready) return
    try {
      sessionStorage.setItem(key, JSON.stringify(state))
    } catch {
      setStorageAvailable(false)
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
    setState((previous) => ({
      ...previous,
      ...change,
      activity: [
        { id: crypto.randomUUID(), message, role, at: Date.now() },
        ...previous.activity,
      ].slice(0, 8),
    }))
    toast.success(message, {
      description: storageAvailable
        ? "Demo only · saved in this tab. No database connection."
        : "Demo only · browser storage is unavailable. Progress may reset when you leave.",
    })
  }
  return { state, ready, storageAvailable, reset, update }
}
export type PreviewSession = ReturnType<typeof usePreviewSession>
export function unavailable(action: string) {
  toast.info(`${action} is unavailable in this preview`, {
    description:
      "This judges demo is not connected to a database. Use borrowlah.my for the live app.",
    duration: 6500,
  })
}
