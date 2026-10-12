"use client"

import { useActionState } from "react"

import { addInventory, checkoutInventory, createHub } from "@/actions/hubs"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function HubForm() {
  const [state, action, pending] = useActionState(createHub, idleState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.name)}><FieldLabel htmlFor="hub-name">Hub name</FieldLabel><Input id="hub-name" name="name" required /><FieldError>{state.fieldErrors?.name?.[0]}</FieldError></Field>
        <Field data-invalid={Boolean(state.fieldErrors?.locationText)}><FieldLabel htmlFor="hub-location">Shared location</FieldLabel><Input id="hub-location" name="locationText" required /><FieldError>{state.fieldErrors?.locationText?.[0]}</FieldError></Field>
      </FieldGroup>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <Button type="submit" variant="cta" className="h-11" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Create hub</Button>
    </form>
  )
}

export function InventoryForm({ hubId, items }: { hubId: string; items: Array<{ id: string; title: string }> }) {
  const [state, action, pending] = useActionState(addInventory, idleState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="hubId" value={hubId} />
      <FieldGroup>
        <Field><FieldLabel htmlFor={`inventory-item-${hubId}`}>Item</FieldLabel><select id={`inventory-item-${hubId}`} name="itemId" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"><option value="">Choose an item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
        <Field><FieldLabel htmlFor={`inventory-quantity-${hubId}`}>Quantity</FieldLabel><Input id={`inventory-quantity-${hubId}`} name="quantity" type="number" min="1" defaultValue="1" required /></Field>
      </FieldGroup>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
      <Button type="submit" variant="cta" className="h-11" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Add inventory</Button>
    </form>
  )
}

export function CheckoutButton({ inventoryId }: { inventoryId: string }) {
  const [state, action, pending] = useActionState(checkoutInventory, idleState)
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="inventoryId" value={inventoryId} />
      <Button type="submit" variant="outline" className="h-11" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Check out</Button>
      {state.message ? <p className="text-sm text-muted-foreground">{state.message}</p> : null}
    </form>
  )
}
