"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  resolveJoinCode,
  type MembershipActionState,
} from "@/actions/membership"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function JoinForm() {
  const router = useRouter()
  const [resolveState, resolveAction, resolving] = useActionState(
    resolveJoinCode,
    idleState
  )
  const [details, setDetails] = useState<MembershipActionState["details"] | null>(
    null
  )
  const [code, setCode] = useState("")

  const resolvedDetails = resolveState.details ?? details

  useEffect(() => {
    if (resolveState.details) setDetails(resolveState.details)
  }, [resolveState.details])

  return (
    <div className="flex flex-col gap-6">
      <form
        action={resolveAction}
        className="flex flex-col gap-4"
      >
        <FieldGroup>
          <Field data-invalid={Boolean(resolveState.fieldErrors?.joinCode)}>
            <FieldLabel htmlFor="joinCode">Township join code</FieldLabel>
            <Input
              id="joinCode"
              name="joinCode"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter your township code"
              autoCapitalize="characters"
              autoComplete="off"
              required
              aria-invalid={Boolean(resolveState.fieldErrors?.joinCode)}
            />
            <FieldDescription>
              The code is provided by your township office.
            </FieldDescription>
            <FieldError>{resolveState.fieldErrors?.joinCode?.[0]}</FieldError>
          </Field>
        </FieldGroup>
        {resolveState.status === "error" && resolveState.message ? (
          <Alert variant="destructive">
            <AlertDescription>{resolveState.message}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" variant="cta" className="h-11 w-full sm:w-auto" disabled={resolving}>
          {resolving ? <Spinner data-icon="inline-start" /> : null}
          Check code
        </Button>
      </form>

      {resolvedDetails ? (
        <form action="/api/onboarding/join" method="post" className="flex flex-col gap-5 border-t border-border pt-5">
          <input type="hidden" name="joinCode" value={resolvedDetails.joinCode} />
          <div>
            <p className="text-sm text-muted-foreground">Joining</p>
            <p className="font-display text-xl font-bold">
              {resolvedDetails.name}
            </p>
          </div>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="neighbourhoodId">Neighbourhood</FieldLabel>
              <select
                id="neighbourhoodId"
                name="neighbourhoodId"
                required
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">Choose one</option>
                {resolvedDetails.neighbourhoods.map((neighbourhood) => (
                  <option key={neighbourhood.id} value={neighbourhood.id}>
                    {neighbourhood.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="unitLabel">Unit label</FieldLabel>
              <Input
                id="unitLabel"
                name="unitLabel"
                placeholder="A-12-3"
                autoComplete="off"
              />
              <FieldDescription>
                Only township admins can see this for verification.
              </FieldDescription>
            </Field>
          </FieldGroup>
          <Button type="submit" variant="cta" className="h-11 w-full sm:w-auto">
            Join township
          </Button>
        </form>
      ) : null}

      <button
        type="button"
        className="h-11 text-sm text-muted-foreground underline underline-offset-4"
        onClick={() => router.push("/home")}
      >
        I already belong to a township
      </button>
    </div>
  )
}
