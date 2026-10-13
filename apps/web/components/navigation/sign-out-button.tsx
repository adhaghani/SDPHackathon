"use client"

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
  const formId = "sign-out-confirm"

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
        <form id={formId} action={signOut}>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>You will need to sign in again to access your township.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction type="submit" form={formId} variant="cta" onClick={() => void wipeGuestOfflineData()}>
              <LogOutIcon aria-hidden="true" />
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
