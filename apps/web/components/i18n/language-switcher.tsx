"use client"

import { useActionState } from "react"
import { LanguagesIcon } from "lucide-react"

import { setPreferredLocale } from "@/actions/i18n"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const idleState = { status: "idle" } as const

export function LanguageSwitcher({
  current,
  next,
  label,
  nextPath = "/",
  className,
  compact = false,
}: {
  current: "en" | "ms"
  next: "en" | "ms"
  label: string
  nextPath?: string
  className?: string
  compact?: boolean
}) {
  const [, action, pending] = useActionState(setPreferredLocale, idleState)

  return (
    <form action={action} className="inline-flex">
      <input type="hidden" name="locale" value={next} />
      <input type="hidden" name="next" value={nextPath} />
      <Button
        type="submit"
        variant="ghost"
        size={compact ? "icon-sm" : "sm"}
        className={cn("min-h-11", className)}
        disabled={pending}
        aria-label={`${label}. Current language: ${current}`}
      >
        {compact ? <LanguagesIcon aria-hidden="true" /> : label}
      </Button>
    </form>
  )
}
