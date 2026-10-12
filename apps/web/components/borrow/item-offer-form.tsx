"use client"

import { useActionState } from "react"
import Link from "next/link"

import { offerItemRequest } from "@/actions/requests"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldDescription, FieldLabel } from "@workspace/ui/components/field"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function ItemOfferForm({
  requestId,
  items,
}: {
  requestId: string
  items: Array<{ id: string; title: string }>
}) {
  const [state, action, pending] = useActionState(offerItemRequest, idleState)

  return (
    <form action={action} className="mt-4 flex flex-col gap-3 border-t border-hairline pt-4">
      <input type="hidden" name="requestId" value={requestId} />
      <Field>
        <FieldLabel htmlFor={`offer-item-${requestId}`}>Your item</FieldLabel>
        <NativeSelect id={`offer-item-${requestId}`} name="itemId" className="w-full">
          <NativeSelectOption value="">Send a message-only offer</NativeSelectOption>
          {items.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>{item.title}</NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldDescription>
          Attach a matching item so the requester can accept immediately.{" "}
          <Link href={`/borrow/new?request=${requestId}`} className="font-bold underline underline-offset-4">List a new item</Link>
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={`offer-message-${requestId}`}>Message</FieldLabel>
        <Textarea id={`offer-message-${requestId}`} name="message" rows={2} maxLength={600} placeholder="I have one available this week." />
      </Field>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Offer this
      </Button>
    </form>
  )
}
