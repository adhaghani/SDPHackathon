"use client"

import { useActionState } from "react"

import {
  acceptHelpRequest,
  completeHelpRequest,
  toggleGroup,
} from "@/actions/community"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function HelpActionButton({ requestId, action }: { requestId: string; action: "accept" | "complete" }) {
  const [state, formAction, pending] = useActionState(
    action === "accept" ? acceptHelpRequest : completeHelpRequest,
    idleState
  )

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <input type="hidden" name="requestId" value={requestId} />
        <Button type="submit" variant={action === "accept" ? "secondary" : "outline"} className="min-h-11 font-bold" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {action === "accept" ? "I'll help" : "Confirm completion"}
        </Button>
      </form>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
    </div>
  )
}

export function GroupActionButton({ groupId, joined }: { groupId: string; joined: boolean }) {
  const [state, action, pending] = useActionState(toggleGroup, idleState)

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="groupId" value={groupId} />
        <Button type="submit" variant={joined ? "ghost" : "outline"} size="sm" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {joined ? "Leave group" : "Join group"}
        </Button>
      </form>
      {state.message ? <Alert><AlertDescription>{state.message}</AlertDescription></Alert> : null}
    </div>
  )
}
