"use client"

import { useActionState } from "react"

import { redeemReward } from "@/actions/rewards"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function RedeemButton({
  rewardId,
  costBp,
  missingBp = 0,
  soldOut = false,
}: {
  rewardId: string
  costBp: number
  missingBp?: number
  soldOut?: boolean
}) {
  const [state, action, pending] = useActionState(redeemReward, idleState)

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="rewardId" value={rewardId} />
        <Button type="submit" variant="cta" className="w-full bg-ink text-white hover:bg-ink-raised disabled:border-2 disabled:border-[#c8c8c0] disabled:bg-transparent disabled:text-ink-soft" disabled={pending || missingBp > 0 || soldOut}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {soldOut ? "Fully redeemed" : missingBp > 0 ? `${missingBp.toLocaleString("en-MY")} BP to go` : `Redeem · ${costBp.toLocaleString("en-MY")} BP`}
        </Button>
      </form>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>
            {state.message} {state.code ? <strong>Voucher code: {state.code}</strong> : null}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
