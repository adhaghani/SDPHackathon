"use client"

import { useActionState } from "react"

import { memberAction, moderationAction } from "@/actions/admin"
import { markRedemptionUsed } from "@/actions/rewards"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function MemberActionButton({ memberId, approve }: { memberId: string; approve: boolean }) {
  const [state, action, pending] = useActionState(memberAction, idleState)
  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="memberId" value={memberId} />
        <input type="hidden" name="approve" value={approve ? "approve" : "reject"} />
        <Button type="submit" variant={approve ? "default" : "ghost"} className="h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {approve ? "Approve" : "Reject"}
        </Button>
      </form>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
    </div>
  )
}

export function ModerationActionButton({ reportId, action, label }: { reportId: string; action: "dismiss" | "hide" | "actioned"; label: string }) {
  const [state, formAction, pending] = useActionState(moderationAction, idleState)
  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <input type="hidden" name="reportId" value={reportId} />
        <input type="hidden" name="action" value={action} />
        <Button type="submit" variant={action === "hide" ? "destructive" : "outline"} className="h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {label}
        </Button>
      </form>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
    </div>
  )
}

export function RedemptionVerificationForm() {
  const [state, action, pending] = useActionState(markRedemptionUsed, idleState)
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="redemption-code" className="text-sm font-medium">Voucher code</label>
        <input id="redemption-code" name="code" required maxLength={8} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 font-mono uppercase tracking-widest outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" />
      </div>
      <Button type="submit" variant="cta" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Mark used
      </Button>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"} className="sm:basis-full"><AlertDescription>{state.message}</AlertDescription></Alert> : null}
    </form>
  )
}
