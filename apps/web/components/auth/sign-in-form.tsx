"use client"

import { useActionState } from "react"
import Link from "next/link"

import { requestMagicLink, signIn } from "@/actions/auth"
import { authContent } from "@/content/auth"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function SignInForm({ next = "/home" }: { next?: string }) {
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    idleState
  )
  const [linkState, linkAction, linkPending] = useActionState(
    requestMagicLink,
    idleState
  )

  const emailError = signInState.fieldErrors?.email?.[0]
  const passwordError = signInState.fieldErrors?.password?.[0]

  return (
    <div className="flex w-full flex-col gap-6">
      <form action={signInAction} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <FieldGroup>
          <Field data-invalid={Boolean(emailError)}>
            <FieldLabel htmlFor="email">{authContent.fields.email}</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(emailError)}
            />
            <FieldError>{emailError}</FieldError>
          </Field>
          <Field data-invalid={Boolean(passwordError)}>
            <FieldLabel htmlFor="password">
              {authContent.fields.password}
            </FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={Boolean(passwordError)}
            />
            <FieldError>{passwordError}</FieldError>
          </Field>
        </FieldGroup>

        {signInState.status === "error" && signInState.message ? (
          <Alert variant="destructive">
            <AlertDescription>{signInState.message}</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" variant="cta" className="h-11 w-full" disabled={signInPending}>
          {signInPending ? <Spinner data-icon="inline-start" /> : null}
          {authContent.signIn.submit}
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        <Separator />
        <form action={linkAction} className="flex flex-col gap-4">
          <Field data-invalid={Boolean(linkState.fieldErrors?.email)}>
            <FieldLabel htmlFor="magic-email">
              {authContent.fields.email}
            </FieldLabel>
            <Input
              id="magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(linkState.fieldErrors?.email)}
            />
            <FieldError>
              {linkState.fieldErrors?.email?.[0] ?? linkState.message}
            </FieldError>
          </Field>
          <Button
            type="submit"
            variant="outline"
            className="h-11 w-full"
            disabled={linkPending}
          >
            {linkPending ? <Spinner data-icon="inline-start" /> : null}
            {authContent.signIn.magicLink}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to BorrowBetter?{" "}
          <Link
            className="font-medium text-foreground underline"
            href="/sign-up"
          >
            {authContent.signIn.createAccount}
          </Link>
        </p>
      </div>
    </div>
  )
}
