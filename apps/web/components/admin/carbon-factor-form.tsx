"use client"

import { useActionState } from "react"

import { saveCarbonFactorAction } from "@/actions/admin"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function CarbonFactorForm({
  categories,
}: {
  categories: Array<{ slug: string; name: string; co2e_kg_per_borrow?: number | null; co2e_source?: string | null }>
}) {
  const [state, action, pending] = useActionState(saveCarbonFactorAction, idleState)
  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="carbon-category">Item category</FieldLabel>
        <NativeSelect id="carbon-category" name="categorySlug" className="w-full" required>
          <NativeSelectOption value="">Choose a category</NativeSelectOption>
          {categories.map((category) => (
            <NativeSelectOption key={category.slug} value={category.slug}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="carbon-factor">kg CO₂e per borrow</FieldLabel>
          <Input id="carbon-factor" name="factorKg" type="number" min="0" step="0.001" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="carbon-source">Cited source</FieldLabel>
          <Input id="carbon-source" name="source" required placeholder="Source name, URL or methodology" />
        </Field>
      </div>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save factor
      </Button>
    </form>
  )
}
