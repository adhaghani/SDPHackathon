"use client"

import { LogOutIcon } from "lucide-react"

import { signOut } from "@/actions/auth"
import { Button } from "@workspace/ui/components/button"

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-11 gap-2"
        aria-label="Sign out"
      >
        <LogOutIcon aria-hidden="true" />
        Sign out
      </Button>
    </form>
  )
}
