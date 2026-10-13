"use client"

import { useActionState } from "react"

import { attachItemToOffer } from "@/actions/requests"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function AttachOfferItemForm({
  offerId,
  items,
}: {
  offerId: string
  items: Array<{ id: string; title: string }>
}) {
  const [state, action, pending] = useActionState(attachItemToOffer, idleState)
  return (
    <form action={action} className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
      <input type="hidden" name="offerId" value={offerId} />
      <label className="text-sm font-bold text-ink" htmlFor={`attach-item-${offerId}`}>
        Attach an item to your offer
      </label>
      <NativeSelect id={`attach-item-${offerId}`} name="itemId" className="w-full" required>
        <NativeSelectOption value="">Choose an item</NativeSelectOption>
        {items.map((item) => (
          <NativeSelectOption key={item.id} value={item.id}>{item.title}</NativeSelectOption>
        ))}
      </NativeSelect>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending || !items.length}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Attach item
      </Button>
      {!items.length ? <p className="text-xs text-ink-muted">List an item first, then attach it here.</p> : null}
    </form>
  )
}
