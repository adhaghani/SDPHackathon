"use client"

import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export function PasswordField({
  id,
  autoComplete,
  error,
  description,
}: {
  id: string
  autoComplete: "current-password" | "new-password"
  error?: string
  description?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <Field data-invalid={Boolean(error)}>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <FieldLabel htmlFor={id}>Password</FieldLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? "Hide" : "Show"}
        </Button>
      </div>
      <Input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : description ? `${id}-hint` : undefined
        }
      />
      {description && !error ? (
        <FieldDescription id={`${id}-hint`}>{description}</FieldDescription>
      ) : null}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  )
}
