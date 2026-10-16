"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { postItemRequest } from "@/actions/requests"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DateRangeField } from "@/components/forms/date-range-field"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function ItemRequestForm({
  categories,
  initialTitle = "",
  onSuccess,
}: {
  categories: Array<{ slug: string; name: string; kind: string }>
  initialTitle?: string
  onSuccess?: () => void
}) {
  const [state, action, pending] = useActionState(postItemRequest, idleState)
  const router = useRouter()

  useEffect(() => {
    if (state.status !== "success") return
    onSuccess?.()
    router.refresh()
  }, [onSuccess, router, state.status])

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="request-title">What do you need?</FieldLabel>
        <Input
          id="request-title"
          name="title"
          defaultValue={initialTitle}
          required
          maxLength={100}
          placeholder="Cordless drill"
        />
        <FieldDescription>
          Do not include your address or unit number.
        </FieldDescription>
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="request-category">Category</FieldLabel>
          <NativeSelect
            id="request-category"
            name="categorySlug"
            className="w-full"
          >
            <NativeSelectOption value="">Any category</NativeSelectOption>
            {categories
              .filter((category) => category.kind === "item")
              .map((category) => (
                <NativeSelectOption key={category.slug} value={category.slug}>
                  {category.name}
                </NativeSelectOption>
              ))}
          </NativeSelect>
        </Field>
        <div className="sm:col-span-2">
          <DateRangeField
            id="request-dates"
            startName="neededFrom"
            endName="neededUntil"
            label="Needed dates"
          />
        </div>
      </div>
      <Field>
        <FieldLabel htmlFor="request-note">Note</FieldLabel>
        <Textarea
          id="request-note"
          name="note"
          rows={3}
          maxLength={600}
          placeholder="What will you use it for?"
        />
      </Field>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink-muted bg-surface px-4 text-sm font-bold text-ink">
        <Checkbox name="alertOptIn" />
        Notify me about new requests in this category
      </label>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Post request
      </Button>
    </form>
  )
}
