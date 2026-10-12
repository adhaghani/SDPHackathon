"use client"

import { useEffect, useRef } from "react"

import { sendForecastNudgeAction } from "@/actions/demand"

export function ForecastNudge() {
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current || typeof window === "undefined") return
    sent.current = true
    void sendForecastNudgeAction()
  }, [])
  return null
}
