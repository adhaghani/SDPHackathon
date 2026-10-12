"use client"

import { LogOutIcon } from "lucide-react"

import { signOut } from "@/actions/auth"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function SignOutButton({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size={compact ? "icon-sm" : "sm"}
        className={cn("min-h-11 gap-2", className)}
        aria-label="Sign out"
      >
        <LogOutIcon aria-hidden="true" />
        <span className={compact ? "sr-only" : undefined}>Sign out</span>
      </Button>
    </form>
  )
}
