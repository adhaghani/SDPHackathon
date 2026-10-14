"use client"

import { useActionState } from "react"
import Link from "next/link"

import { signUp } from "@/actions/auth"
import { authContent } from "@/content/auth"
import { PasswordField } from "@/components/auth/password-field"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldContent,
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
      {inviteCode ? (
        <input type="hidden" name="inviteCode" value={inviteCode} />
      ) : null}
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
            aria-describedby={
              displayNameError ? "displayName-error" : undefined
            }
          />
          <FieldError id="displayName-error">{displayNameError}</FieldError>
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
            aria-describedby={emailError ? "signup-email-error" : undefined}
          />
          <FieldError id="signup-email-error">{emailError}</FieldError>
        </Field>
        <PasswordField
          id="signup-password"
          autoComplete="new-password"
          error={passwordError}
          description="Use at least 8 characters with a letter and number."
        />
      </FieldGroup>

      <FieldSet aria-label="Consent">
        <Field orientation="horizontal" data-invalid={Boolean(termsError)}>
          <Checkbox
            id="acceptedTerms"
            className="mt-3.5!"
            name="acceptedTerms"
            aria-label={authContent.consent.terms}
            aria-invalid={Boolean(termsError)}
            aria-describedby={termsError ? "terms-error" : undefined}
          />
          <FieldContent>
            <FieldLabel
              htmlFor="acceptedTerms"
              className="min-h-11 items-center"
            >
              {authContent.consent.terms}
            </FieldLabel>
            <FieldError id="terms-error">{termsError}</FieldError>
          </FieldContent>
        </Field>
        <Field orientation="horizontal" data-invalid={Boolean(privacyError)}>
          <Checkbox
            id="acceptedPrivacy"
            className="mt-3.5!"
            name="acceptedPrivacy"
            aria-label={authContent.consent.privacy}
            aria-invalid={Boolean(privacyError)}
            aria-describedby={privacyError ? "privacy-error" : undefined}
          />
          <FieldContent>
            <FieldLabel
              htmlFor="acceptedPrivacy"
              className="min-h-11 items-center"
            >
              {authContent.consent.privacy}
            </FieldLabel>
            <FieldError id="privacy-error">{privacyError}</FieldError>
          </FieldContent>
        </Field>
      </FieldSet>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        variant="cta"
        size="cta"
        className="w-full"
        disabled={pending}
      >
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {authContent.signUp.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link
          className="inline-flex min-h-11 items-center font-bold text-foreground underline underline-offset-4 hover:decoration-2"
          href="/sign-in"
        >
          {authContent.signUp.signInInstead}
        </Link>
      </p>
    </form>
  )
}
