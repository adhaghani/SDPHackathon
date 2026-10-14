"use client"

import { useId, useActionState } from "react"

import { LogOutIcon } from "lucide-react"

import { signOut } from "@/actions/auth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Button } from "@workspace/ui/components/button"
import { wipeGuestOfflineData } from "@/lib/offline-queue"
import { cn } from "@workspace/ui/lib/utils"

export function SignOutButton({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const formId = useId()
  const [state, action, pending] = useActionState(signOut, { status: "idle" })

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size={compact ? "icon-sm" : "sm"}
            className={cn("min-h-11 gap-2", className)}
            aria-label="Sign out"
          >
            <LogOutIcon aria-hidden="true" />
            <span className={compact ? "sr-only" : undefined}>Sign out</span>
          </Button>
        }
      />
      <AlertDialogContent>
        <form id={formId} action={action}>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>You will need to sign in again to access your township.</AlertDialogDescription>
          </AlertDialogHeader>
          {state.message ? <p role="alert" className="mt-3 text-sm">{state.message}</p> : null}
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction type="submit" form={formId} variant="cta" disabled={pending} onClick={() => void wipeGuestOfflineData().catch(() => undefined)}>
              <LogOutIcon aria-hidden="true" />
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
