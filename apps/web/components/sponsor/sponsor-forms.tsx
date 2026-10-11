"use client"

import { useActionState } from "react"

import { createPartnerChallenge, createPartnerReward } from "@/actions/sponsor"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function SponsorRewardForm() {
  const [state, action, pending] = useActionState(createPartnerReward, idleState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="sponsor-reward-title">Reward title</FieldLabel>
          <Input id="sponsor-reward-title" name="title" required />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="sponsor-reward-description">Description</FieldLabel>
          <Textarea id="sponsor-reward-description" name="description" rows={3} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sponsor-reward-cost">Cost (BP)</FieldLabel>
            <Input id="sponsor-reward-cost" name="costBp" type="number" min="1" required />
          </Field>
          <Field>
            <FieldLabel htmlFor="sponsor-reward-stock">Stock</FieldLabel>
            <Input id="sponsor-reward-stock" name="stock" type="number" min="1" defaultValue="10" required />
          </Field>
        </div>
      </FieldGroup>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <Button type="submit" className="h-11" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Create reward</Button>
    </form>
  )
}

export function SponsorChallengeForm() {
  const [state, action, pending] = useActionState(createPartnerChallenge, idleState)
  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="sponsor-challenge-title">Challenge title</FieldLabel>
          <Input id="sponsor-challenge-title" name="title" required />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="sponsor-challenge-description">Description</FieldLabel>
          <Textarea id="sponsor-challenge-description" name="description" rows={3} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field><FieldLabel htmlFor="sponsor-challenge-target">Target</FieldLabel><Input id="sponsor-challenge-target" name="target" type="number" min="1" required /></Field>
          <Field><FieldLabel htmlFor="sponsor-challenge-reward">Reward BP</FieldLabel><Input id="sponsor-challenge-reward" name="rewardPoints" type="number" min="0" defaultValue="100" required /></Field>
          <Field><FieldLabel htmlFor="sponsor-challenge-ends">Ends</FieldLabel><Input id="sponsor-challenge-ends" name="endsAt" type="date" required /></Field>
        </div>
      </FieldGroup>
      {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      <Button type="submit" className="h-11" disabled={pending}>{pending ? <Spinner data-icon="inline-start" /> : null}Create challenge</Button>
    </form>
  )
}
