"use client"

import { useActionState } from "react"

import { setPreferredLocale } from "@/actions/i18n"
import { Button } from "@workspace/ui/components/button"

const idleState = { status: "idle" } as const

export function LanguageSwitcher({
  current,
  next,
  label,
  nextPath = "/",
}: {
  current: "en" | "ms"
  next: "en" | "ms"
  label: string
  nextPath?: string
}) {
  const [, action, pending] = useActionState(setPreferredLocale, idleState)

  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="locale" value={next} />
      <input type="hidden" name="next" value={nextPath} />
      <Button type="submit" variant="ghost" size="sm" className="h-9" disabled={pending} aria-label={`${label}. Current language: ${current}`}>
        {label}
      </Button>
    </form>
  )
}
