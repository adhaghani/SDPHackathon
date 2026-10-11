"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"

import { createItem } from "@/actions/borrow"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function ItemForm({
  categories,
}: {
  categories: Array<{ id: string; slug: string; name: string }>
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createItem, idleState)

  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="item-title">Item title</FieldLabel>
          <Input id="item-title" name="title" required placeholder="Folding ladder" />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="item-description">Description</FieldLabel>
          <Textarea id="item-description" name="description" rows={4} />
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.categorySlug)}>
          <FieldLabel htmlFor="item-category">Category</FieldLabel>
          <NativeSelect id="item-category" name="categorySlug" className="w-full" required>
            <NativeSelectOption value="">Choose a category</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.slug}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{state.fieldErrors?.categorySlug?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="item-condition">Condition</FieldLabel>
          <NativeSelect id="item-condition" name="condition" defaultValue="good" className="w-full">
            <NativeSelectOption value="like_new">Like new</NativeSelectOption>
            <NativeSelectOption value="good">Good</NativeSelectOption>
            <NativeSelectOption value="fair">Fair</NativeSelectOption>
          </NativeSelect>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="estimated-price">Estimated new price (RM)</FieldLabel>
            <Input id="estimated-price" name="estimatedNewPriceRm" type="number" min="0" step="0.01" placeholder="250" />
            <FieldDescription>Optional. Used for estimated impact only.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="deposit">Deposit (RM)</FieldLabel>
            <Input id="deposit" name="depositRm" type="number" min="0" step="0.01" defaultValue="0" />
            <FieldDescription>Recorded only. BorrowBetter never handles money.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="max-loan-days">Maximum loan days</FieldLabel>
            <Input id="max-loan-days" name="maxLoanDays" type="number" min="1" max="30" defaultValue="3" required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="handover-option">Handover option</FieldLabel>
          <Input id="handover-option" name="handoverOptions" defaultValue="Meet in a shared space" required />
          <FieldDescription>Never share a private address in the listing.</FieldDescription>
        </Field>
      </FieldGroup>
      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === "success" ? (
        <Alert>
          <AlertDescription>
            {state.message}{" "}
            {state.itemId ? (
              <button type="button" className="underline underline-offset-4" onClick={() => router.push(`/borrow/items/${state.itemId}`)}>
                View item
              </button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        List item
      </Button>
    </form>
  )
}
