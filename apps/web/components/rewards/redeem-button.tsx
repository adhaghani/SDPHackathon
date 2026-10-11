"use client"

import { useActionState } from "react"

import { redeemReward } from "@/actions/rewards"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function RedeemButton({ rewardId, costBp }: { rewardId: string; costBp: number }) {
  const [state, action, pending] = useActionState(redeemReward, idleState)

  return (
    <div className="flex flex-col gap-2">
      <form action={action}>
        <input type="hidden" name="rewardId" value={rewardId} />
        <Button type="submit" className="h-11 w-full" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Redeem for {costBp} BP
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
