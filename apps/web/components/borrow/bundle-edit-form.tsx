"use client"

import { useActionState } from "react"

import { updateBundle } from "@/actions/bundles"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function BundleEditForm({
  bundleId,
  title,
  description,
  items,
  selectedIds,
}: {
  bundleId: string
  title: string
  description: string
  items: Array<{ id: string; title: string }>
  selectedIds: string[]
}) {
  const [state, action, pending] = useActionState(updateBundle, idleState)
  return (
    <form action={action} className="mt-6 bb-card flex flex-col gap-4 p-5">
      <input type="hidden" name="bundleId" value={bundleId} />
      <Field>
        <FieldLabel htmlFor="edit-bundle-title">Bundle title</FieldLabel>
        <Input id="edit-bundle-title" name="title" defaultValue={title} required maxLength={120} />
      </Field>
      <Field>
        <FieldLabel htmlFor="edit-bundle-description">Description</FieldLabel>
        <Textarea id="edit-bundle-description" name="description" defaultValue={description} rows={3} maxLength={600} />
      </Field>
      <fieldset>
        <legend className="text-sm font-bold text-ink">Bundle items</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-ink-muted bg-surface px-3 text-sm text-ink">
              <input
                type="checkbox"
                name="itemIds"
                value={item.id}
                defaultChecked={selectedIds.includes(item.id)}
                className="size-4 accent-ink"
              />
              {item.title}
            </label>
          ))}
        </div>
      </fieldset>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save bundle
      </Button>
    </form>
  )
}
