"use client"

import { useActionState } from "react"

import { createAnnouncement, createHelpRequest } from "@/actions/community"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function CommunityForms({ role }: { role: string }) {
  const [announcementState, announcementAction, announcementPending] = useActionState(createAnnouncement, idleState)
  const [helpState, helpAction, helpPending] = useActionState(createHelpRequest, idleState)

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {role === "organiser" || role === "township_admin" ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Post an announcement</h2>
          <form action={announcementAction} className="mt-4 flex flex-col gap-4">
            <FieldGroup>
              <Field data-invalid={Boolean(announcementState.fieldErrors?.title)}>
                <FieldLabel htmlFor="announcement-title">Title</FieldLabel>
                <Input id="announcement-title" name="title" required />
                <FieldError>{announcementState.fieldErrors?.title?.[0]}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="announcement-body">Message</FieldLabel>
                <Textarea id="announcement-body" name="body" rows={4} required />
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="announcement-pinned" name="pinned" aria-label="Pin announcement" />
                <FieldLabel htmlFor="announcement-pinned">Pin this announcement</FieldLabel>
              </Field>
            </FieldGroup>
            {announcementState.message ? <Alert variant={announcementState.status === "error" ? "destructive" : "default"}><AlertDescription>{announcementState.message}</AlertDescription></Alert> : null}
            <Button type="submit" className="h-11" disabled={announcementPending}>
              {announcementPending ? <Spinner data-icon="inline-start" /> : null}
              Post announcement
            </Button>
          </form>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Ask for help</h2>
        <form action={helpAction} className="mt-4 flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={Boolean(helpState.fieldErrors?.title)}>
              <FieldLabel htmlFor="help-title">What do you need?</FieldLabel>
              <Input id="help-title" name="title" required placeholder="Help carry groceries" />
              <FieldError>{helpState.fieldErrors?.title?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="help-details">Details</FieldLabel>
              <Textarea id="help-details" name="details" rows={3} />
            </Field>
            <Field>
              <FieldLabel htmlFor="help-kind">Kind</FieldLabel>
              <select id="help-kind" name="kind" defaultValue="errand" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="errand">Errand</option>
                <option value="tech_help">Tech help</option>
                <option value="transport">Transport</option>
                <option value="companionship">Companionship</option>
                <option value="home_help">Home help</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="help-needed-by">Needed by</FieldLabel>
              <Input id="help-needed-by" name="neededBy" type="date" />
            </Field>
          </FieldGroup>
          {helpState.message ? <Alert variant={helpState.status === "error" ? "destructive" : "default"}><AlertDescription>{helpState.message}</AlertDescription></Alert> : null}
          <Button type="submit" className="h-11" disabled={helpPending}>
            {helpPending ? <Spinner data-icon="inline-start" /> : null}
            Post helping request
          </Button>
        </form>
      </section>
    </div>
  )
}
