"use client"

import { useActionState } from "react"

import { deleteBundle } from "@/actions/bundles"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
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
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function DeleteBundleButton({ bundleId }: { bundleId: string }) {
  const [state, action, pending] = useActionState(deleteBundle, idleState)
  const formId = `delete-bundle-${bundleId}`

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive" className="mt-4">
            Delete bundle
          </Button>
        }
      />
      <AlertDialogContent>
        <form id={formId} action={action}>
          <input type="hidden" name="bundleId" value={bundleId} />
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              The bundle will be removed from the marketplace. Individual items will remain available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state.status === "error" && state.message ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter className="mt-5">
            <AlertDialogCancel>Keep bundle</AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              form={formId}
              variant="destructive"
              disabled={pending}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Delete bundle
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
