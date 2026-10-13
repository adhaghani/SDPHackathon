"use client"

import { useActionState } from "react"

import { deleteBundle } from "@/actions/bundles"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function DeleteBundleButton({ bundleId }: { bundleId: string }) {
  const [state, action, pending] = useActionState(deleteBundle, idleState)
  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="bundleId" value={bundleId} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Delete bundle
      </Button>
      {state.status === "error" && state.message ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
