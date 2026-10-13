"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"

import { claimGiveaway, transitionGiveaway } from "@/actions/giveaway"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export type GiveawayRole = "giver" | "taker" | "neighbour"

export function GiveawayActions({
  giveawayId,
  status,
  role,
  giverConfirmed,
  takerConfirmed,
}: {
  giveawayId: string
  status: string
  role: GiveawayRole
  giverConfirmed: boolean
  takerConfirmed: boolean
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    role === "neighbour" ? claimGiveaway : transitionGiveaway,
    idleState
  )

  if (status === "completed") {
    return (
      <p className="text-sm font-semibold text-ink">
        Completed · BP awarded to both sides
      </p>
    )
  }

  if (status === "active" && role === "neighbour") {
    return (
      <div className="flex flex-col gap-2">
        <form action={action}>
          <input type="hidden" name="giveawayId" value={giveawayId} />
          <Button type="submit" variant="cta" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Ask to take this
          </Button>
        </form>
        {state.message ? (
          <Alert variant={state.status === "error" ? "destructive" : "default"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  if (status === "active" && role === "giver") {
    return (
      <div className="flex flex-col gap-2">
        <form action={action}>
          <input type="hidden" name="giveawayId" value={giveawayId} />
          <input type="hidden" name="action" value="withdraw" />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Withdraw listing
          </Button>
        </form>
        {state.message ? (
          <Alert variant={state.status === "error" ? "destructive" : "default"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    )
  }

  if (status === "reserved" && (role === "giver" || role === "taker")) {
    const confirmed = role === "giver" ? giverConfirmed : takerConfirmed
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <form action={action}>
            <input type="hidden" name="giveawayId" value={giveawayId} />
            <input type="hidden" name="action" value="confirm_handover" />
            <Button
              type="submit"
              variant={confirmed ? "outline" : "cta"}
              disabled={pending || confirmed}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {confirmed ? "You confirmed" : "Confirm handover"}
            </Button>
          </form>
          <form action={action}>
            <input type="hidden" name="giveawayId" value={giveawayId} />
            <input type="hidden" name="action" value="cancel_claim" />
            <Button type="submit" variant="ghost" disabled={pending}>
              Cancel
            </Button>
          </form>
        </div>
        {state.message ? (
          <Alert variant={state.status === "error" ? "destructive" : "default"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        <button
          type="button"
          className="w-fit text-xs font-semibold text-ink-muted underline underline-offset-4 hover:text-ink"
          onClick={() => router.refresh()}
        >
          Refresh status
        </button>
      </div>
    )
  }

  return null
}
