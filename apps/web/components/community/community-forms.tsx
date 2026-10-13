"use client"

import { useActionState } from "react"
import { HandHelpingIcon, MegaphoneIcon } from "lucide-react"

import { createAnnouncement, createHelpRequest } from "@/actions/community"
import { DateField } from "@/components/forms/date-field"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function CommunityForms({ role }: { role: string }) {
  const canAnnounce = role === "organiser" || role === "township_admin"

  return (
    <section aria-labelledby="community-actions-heading" className="bb-card p-5">
      <div>
        <h2 id="community-actions-heading" className="text-title text-ink">Quick actions</h2>
        <p className="mt-1 text-sm text-ink-muted">Publish updates or ask for help without losing your place.</p>
      </div>
      <div className="mt-4 grid gap-2">
        {canAnnounce ? <AnnouncementDialog /> : null}
        <HelpDialog />
      </div>
    </section>
  )
}

function AnnouncementDialog() {
  const [state, action, pending] = useActionState(createAnnouncement, idleState)

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="cta" className="w-full">
            <MegaphoneIcon data-icon="inline-start" />
            Post an announcement
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Post an announcement</DialogTitle>
            <DialogDescription>Share an important update with everyone in the township.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="mt-4">
            <Field data-invalid={Boolean(state.fieldErrors?.title)}>
              <FieldLabel htmlFor="announcement-title">Title</FieldLabel>
              <Input
                id="announcement-title"
                name="title"
                required
                aria-invalid={Boolean(state.fieldErrors?.title)}
              />
              <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="announcement-body">Message</FieldLabel>
              <Textarea id="announcement-body" name="body" rows={5} required />
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="announcement-pinned" name="pinned" aria-label="Pin announcement" />
              <FieldLabel htmlFor="announcement-pinned">Pin this announcement</FieldLabel>
            </Field>
          </FieldGroup>
          {state.message ? (
            <Alert variant={state.status === "error" ? "destructive" : "default"} className="mt-4">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter className="mt-5">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="cta" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Post announcement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HelpDialog() {
  const [state, action, pending] = useActionState(createHelpRequest, idleState)

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" className="w-full">
            <HandHelpingIcon data-icon="inline-start" />
            Ask for help
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl">
        <form action={action}>
          <DialogHeader>
            <DialogTitle>Ask for help</DialogTitle>
            <DialogDescription>
              Neighbours see your first name and the request. Meet in a shared space.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="mt-4">
            <Field data-invalid={Boolean(state.fieldErrors?.title)}>
              <FieldLabel htmlFor="help-title">What do you need?</FieldLabel>
              <Input
                id="help-title"
                name="title"
                required
                placeholder="Help carry groceries"
                aria-invalid={Boolean(state.fieldErrors?.title)}
              />
              <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="help-details">Details</FieldLabel>
              <Textarea id="help-details" name="details" rows={4} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="help-kind">Kind</FieldLabel>
                <NativeSelect id="help-kind" name="kind" defaultValue="errand" className="w-full">
                  <NativeSelectOption value="errand">Errand</NativeSelectOption>
                  <NativeSelectOption value="tech_help">Tech help</NativeSelectOption>
                  <NativeSelectOption value="transport">Transport</NativeSelectOption>
                  <NativeSelectOption value="companionship">Companionship</NativeSelectOption>
                  <NativeSelectOption value="home_help">Home help</NativeSelectOption>
                  <NativeSelectOption value="other">Other</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="help-recurrence">Repeat</FieldLabel>
                <NativeSelect id="help-recurrence" name="recurrence" defaultValue="none" className="w-full">
                  <NativeSelectOption value="none">Does not repeat</NativeSelectOption>
                  <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
                  <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DateField id="help-needed-by" name="neededBy" label="Needed by" />
              <DateField id="help-recurrence-until" name="recurrenceUntil" label="Repeat until" />
            </div>

            <Field>
              <FieldLabel htmlFor="help-recurrence-interval">Repeat interval (days)</FieldLabel>
              <Input id="help-recurrence-interval" name="recurrenceIntervalDays" type="number" min="1" max="60" placeholder="7" />
            </Field>
          </FieldGroup>

          {state.message ? (
            <Alert variant={state.status === "error" ? "destructive" : "default"} className="mt-4">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="mt-5">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" variant="cta" disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Post helping request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
