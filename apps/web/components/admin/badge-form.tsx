"use client"

import { useActionState } from "react"

import { saveBadge } from "@/actions/admin"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function BadgeForm() {
  const [state, action, pending] = useActionState(saveBadge, idleState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup>
        <Field><FieldLabel htmlFor="badge-slug">Slug</FieldLabel><Input id="badge-slug" name="slug" placeholder="rain-check" required /><FieldError>{state.message}</FieldError></Field>
        <Field><FieldLabel htmlFor="badge-name">Name</FieldLabel><Input id="badge-name" name="name" placeholder="Rain check" required /></Field>
        <Field><FieldLabel htmlFor="badge-description">Description</FieldLabel><Textarea id="badge-description" name="description" rows={3} required /></Field>
        <Field><FieldLabel htmlFor="badge-icon">Icon</FieldLabel><NativeSelect id="badge-icon" name="icon" className="w-full"><NativeSelectOption value="award">Award</NativeSelectOption><NativeSelectOption value="hand-heart">Helping hand</NativeSelectOption><NativeSelectOption value="leaf">Leaf</NativeSelectOption><NativeSelectOption value="recycle">Recycle</NativeSelectOption><NativeSelectOption value="shield">Shield</NativeSelectOption><NativeSelectOption value="sparkles">Sparkles</NativeSelectOption><NativeSelectOption value="users-round">Community</NativeSelectOption></NativeSelect></Field>
      </FieldGroup>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <Button type="submit" variant="cta" className="h-11" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Save award</Button>
    </form>
  )
}
