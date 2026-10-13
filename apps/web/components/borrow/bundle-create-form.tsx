"use client"

import { useActionState } from "react"

import { createBundle } from "@/actions/bundles"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function BundleCreateForm({ items }: { items: Array<{ id: string; title: string }> }) {
  const [state, action, pending] = useActionState(createBundle, idleState)
  return (
    <form action={action} className="bb-card flex flex-col gap-4 p-5">
      <Field>
        <FieldLabel htmlFor="bundle-title">Bundle title</FieldLabel>
        <Input id="bundle-title" name="title" required maxLength={120} placeholder="Camping kit" />
      </Field>
      <Field>
        <FieldLabel htmlFor="bundle-description">Description</FieldLabel>
        <Textarea id="bundle-description" name="description" rows={3} maxLength={600} />
      </Field>
      <fieldset>
        <legend className="text-sm font-bold text-ink">Choose at least two active items</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <label key={item.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-ink-muted bg-surface px-3 text-sm text-ink">
              <input type="checkbox" name="itemIds" value={item.id} className="size-4 accent-ink" />
              {item.title}
            </label>
          ))}
        </div>
        {!items.length ? <p className="mt-3 text-sm text-ink-muted">List at least two active items first.</p> : null}
      </fieldset>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending || items.length < 2}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Create bundle
      </Button>
    </form>
  )
}
