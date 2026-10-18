"use client"

import { useActionState } from "react"
import { toast } from "sonner"

import { redeemReward, type RewardsActionState } from "@/actions/rewards"
import { CopyCodeButton } from "@/components/rewards/copy-code-button"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

async function redeemWithFeedback(
  state: RewardsActionState,
  formData: FormData
) {
  const result = await redeemReward(state, formData)
  if (result.status === "success") {
    toast.success("Voucher ready to use.", {
      id: `reward-redeemed-${String(formData.get("rewardId"))}`,
      duration: 7000,
      action: {
        label: "View vouchers",
        onClick: () => {
          const section = document.getElementById("vouchers-heading")
          section?.scrollIntoView({ block: "start" })
          section?.focus({ preventScroll: true })
        },
      },
    })
  }
  return result
}

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
  const [state, action, pending] = useActionState(redeemWithFeedback, idleState)

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <form action={action} className="min-w-0">
        <input type="hidden" name="rewardId" value={rewardId} />
        <Button
          type="submit"
          variant="default"
          className="w-full whitespace-normal"
          disabled={pending || missingBp > 0 || soldOut}
          aria-label={
            soldOut
              ? "Fully redeemed"
              : missingBp > 0
                ? `${missingBp.toLocaleString("en-MY")} more BetterPoints needed`
                : `Redeem reward for ${costBp.toLocaleString("en-MY")} BetterPoints`
          }
        >
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {pending
            ? "Redeeming…"
            : soldOut
              ? "Fully redeemed"
              : missingBp > 0
                ? `${missingBp.toLocaleString("en-MY")} BP to go`
                : "Redeem reward"}
        </Button>
      </form>
      {state.status === "error" && state.message ? (
        <Alert
          variant="destructive"
          className="min-w-0 [overflow-wrap:anywhere]"
        >
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === "success" && state.code ? (
        <div className="flex min-w-0 flex-col items-start gap-2 rounded-xl border border-hairline p-3">
          <span className="text-xs">Voucher code</span>
          <code className="max-w-full font-mono text-base font-bold break-all select-all">
            {state.code}
          </code>
          <CopyCodeButton code={state.code} />
          <a
            href="#vouchers-heading"
            className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4"
          >
            View my vouchers
          </a>
        </div>
      ) : null}
    </div>
  )
}
