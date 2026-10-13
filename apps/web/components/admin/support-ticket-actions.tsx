"use client"

import { useActionState } from "react"

import { resolveSupportTicketAction } from "@/actions/admin"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function SupportTicketActions({
  ticketId,
  currentStatus,
}: {
  ticketId: string
  currentStatus: string
}) {
  const [state, action, pending] = useActionState(resolveSupportTicketAction, idleState)
  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Button type="submit" name="status" value="in_progress" variant="outline" size="sm" disabled={pending || currentStatus === "in_progress"}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Start review
      </Button>
      <Button type="submit" name="status" value="resolved" variant="cta" size="sm" disabled={pending || currentStatus === "resolved"}>
        Resolve
      </Button>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"} className="w-full">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )
}
