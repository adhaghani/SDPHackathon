"use client"

import { useActionState } from "react"

import { blockUserAction } from "@/actions/reports"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function BlockUserButton({ blockedId, name }: { blockedId: string; name: string }) {
  const [state, action, pending] = useActionState(blockUserAction, idleState)

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="blockedId" value={blockedId} />
        <Button type="submit" variant="ghost" className="h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Block {name}
        </Button>
      </form>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
    </div>
  )
}
