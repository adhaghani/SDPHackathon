"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { ChevronDownIcon } from "lucide-react"

import { requestMagicLink, signIn } from "@/actions/auth"
import { authContent } from "@/content/auth"
import { PasswordField } from "@/components/auth/password-field"
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
  const [email, setEmail] = useState("")
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            <FieldError id="email-error">{emailError}</FieldError>
          </Field>
          <PasswordField
            id="password"
            autoComplete="current-password"
            error={passwordError}
          />
        </FieldGroup>

        {signInState.status === "error" && signInState.message ? (
          <Alert variant="destructive">
            <AlertDescription>{signInState.message}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          type="submit"
          variant="cta"
          size="cta"
          className="w-full"
          disabled={signInPending}
        >
          {signInPending ? <Spinner data-icon="inline-start" /> : null}
          {authContent.signIn.submit}
        </Button>
      </form>

      <div className="flex flex-col gap-4">
        <Separator />
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-sm font-bold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
            Sign in without a password
            <ChevronDownIcon
              aria-hidden="true"
              className="size-4 shrink-0 group-open:rotate-180"
            />
          </summary>
          <form action={linkAction} className="mt-4 flex flex-col gap-4">
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(linkState.fieldErrors?.email)}
                aria-describedby={
                  linkState.fieldErrors?.email ? "magic-email-error" : undefined
                }
              />
              <FieldError id="magic-email-error">
                {linkState.fieldErrors?.email?.[0]}
              </FieldError>
            </Field>
            {linkState.message ? (
              <Alert
                variant={
                  linkState.status === "error" ? "destructive" : "default"
                }
                role={linkState.status === "error" ? "alert" : "status"}
              >
                <AlertDescription>{linkState.message}</AlertDescription>
              </Alert>
            ) : null}
            <Button
              type="submit"
              variant="outline"
              size="cta"
              className="w-full"
              disabled={linkPending}
            >
              {linkPending ? <Spinner data-icon="inline-start" /> : null}
              {authContent.signIn.magicLink}
            </Button>
          </form>
        </details>

        <p className="text-center text-sm text-muted-foreground">
          New to BorrowLah?{" "}
          <Link
            className="inline-flex min-h-11 items-center font-bold text-foreground underline underline-offset-4 hover:decoration-2"
            href="/sign-up"
          >
            {authContent.signIn.createAccount}
          </Link>
        </p>
      </div>
    </div>
  )
}
