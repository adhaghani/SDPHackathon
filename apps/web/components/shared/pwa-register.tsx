"use client"

import { useEffect } from "react"
import { isJudgesPreview } from "@/lib/judges/config"

export function PwaRegister() {
  useEffect(() => {
    if (isJudgesPreview() || !("serviceWorker" in navigator)) return
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Install support is optional; the app remains fully usable without it.
    })
  }, [])

  return null
}
