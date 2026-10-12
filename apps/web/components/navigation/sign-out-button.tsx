"use client"

import { LogOutIcon } from "lucide-react"

import { signOut } from "@/actions/auth"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={cn("min-h-11 gap-2", className)}
        aria-label="Sign out"
      >
        <LogOutIcon aria-hidden="true" />
        Sign out
      </Button>
    </form>
  )
}
