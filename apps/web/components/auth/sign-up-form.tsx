"use client"

import { useActionState } from "react"
import Link from "next/link"

import { signUp } from "@/actions/auth"
import { authContent } from "@/content/auth"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function SignUpForm({ inviteCode }: { inviteCode?: string }) {
  const [state, action, pending] = useActionState(signUp, idleState)
  const displayNameError = state.fieldErrors?.displayName?.[0]
  const emailError = state.fieldErrors?.email?.[0]
  const passwordError = state.fieldErrors?.password?.[0]
  const termsError = state.fieldErrors?.acceptedTerms?.[0]
  const privacyError = state.fieldErrors?.acceptedPrivacy?.[0]

  return (
    <form action={action} className="flex w-full flex-col gap-5">
      {inviteCode ? <input type="hidden" name="inviteCode" value={inviteCode} /> : null}
      <FieldGroup>
        <Field data-invalid={Boolean(displayNameError)}>
          <FieldLabel htmlFor="displayName">
            {authContent.fields.displayName}
          </FieldLabel>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            required
            aria-invalid={Boolean(displayNameError)}
          />
          <FieldError>{displayNameError}</FieldError>
        </Field>
        <Field data-invalid={Boolean(emailError)}>
          <FieldLabel htmlFor="signup-email">
            {authContent.fields.email}
          </FieldLabel>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(emailError)}
          />
          <FieldError>{emailError}</FieldError>
        </Field>
        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="signup-password">
            {authContent.fields.password}
          </FieldLabel>
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={Boolean(passwordError)}
          />
          <FieldError>
            {passwordError ??
              "Use at least 8 characters with a letter and number."}
          </FieldError>
        </Field>
      </FieldGroup>

      <FieldSet aria-label="Consent">
        <Field data-invalid={Boolean(termsError)}>
          <Checkbox
            id="acceptedTerms"
            name="acceptedTerms"
            aria-label={authContent.consent.terms}
          />
          <FieldLabel htmlFor="acceptedTerms">
            {authContent.consent.terms}
          </FieldLabel>
          <FieldError>{termsError}</FieldError>
        </Field>
        <Field data-invalid={Boolean(privacyError)}>
          <Checkbox
            id="acceptedPrivacy"
            name="acceptedPrivacy"
            aria-label={authContent.consent.privacy}
          />
          <FieldLabel htmlFor="acceptedPrivacy">
            {authContent.consent.privacy}
          </FieldLabel>
          <FieldError>{privacyError}</FieldError>
        </Field>
      </FieldSet>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" variant="cta" className="h-11 w-full" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {authContent.signUp.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link className="font-medium text-foreground underline" href="/sign-in">
          {authContent.signUp.signInInstead}
        </Link>
      </p>
    </form>
  )
}
