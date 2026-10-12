"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"

import { createEvent } from "@/actions/events"
import { prepareImageForUpload } from "@/lib/media"
import { getBrowserClient } from "@/lib/supabase/browser"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const
const accessibilityOptions = ["step-free", "seated or low-impact", "quiet", "family-friendly"]
const languageOptions = ["English", "Bahasa Malaysia", "Mandarin", "Tamil"]

export function EventForm({
  categories,
}: {
  categories: Array<{ id: string; slug: string; name: string }>
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createEvent, idleState)
  const [coverPath, setCoverPath] = useState("/demo/event-placeholder.svg")
  const [coverMessage, setCoverMessage] = useState<string | null>(null)

  async function handleCover(file: File | undefined) {
    if (!file) return
    setCoverMessage(null)
    try {
      const blob = await prepareImageForUpload(file, { maxDimension: 1200, quality: 0.82 })
      const path = `event-${crypto.randomUUID()}.webp`
      const { error } = await getBrowserClient().storage.from("item-photos").upload(path, blob, { upsert: true })
      if (error) throw error
      const { data } = getBrowserClient().storage.from("item-photos").getPublicUrl(path)
      setCoverPath(data.publicUrl)
      setCoverMessage("Cover image compressed and uploaded.")
    } catch {
      setCoverPath("/demo/event-placeholder.svg")
      setCoverMessage("Cover upload is unavailable here, so the demo poster will be used.")
    }
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="coverPath" value={coverPath} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="event-cover">Cover image</FieldLabel>
          <Input
            id="event-cover"
            name="cover"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => void handleCover(event.target.files?.[0])}
          />
          <FieldDescription>Optional. Images are compressed before upload; a themed demo poster is used as a fallback.</FieldDescription>
          {coverMessage ? <p className="text-sm text-muted-foreground">{coverMessage}</p> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="title">Event title</FieldLabel>
          <Input id="title" name="title" required aria-invalid={Boolean(state.fieldErrors?.title)} />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" name="description" rows={4} />
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.categorySlug)}>
          <FieldLabel htmlFor="categorySlug">Category</FieldLabel>
          <NativeSelect id="categorySlug" name="categorySlug" className="w-full" required>
            <NativeSelectOption value="">Choose a category</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.slug}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{state.fieldErrors?.categorySlug?.[0]}</FieldError>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(state.fieldErrors?.startsAt)}>
            <FieldLabel htmlFor="startsAt">Starts</FieldLabel>
            <Input id="startsAt" name="startsAt" type="datetime-local" required />
            <FieldError>{state.fieldErrors?.startsAt?.[0]}</FieldError>
          </Field>
          <Field data-invalid={Boolean(state.fieldErrors?.endsAt)}>
            <FieldLabel htmlFor="endsAt">Ends</FieldLabel>
            <Input id="endsAt" name="endsAt" type="datetime-local" required />
            <FieldError>{state.fieldErrors?.endsAt?.[0]}</FieldError>
          </Field>
        </div>
        <Field data-invalid={Boolean(state.fieldErrors?.locationText)}>
          <FieldLabel htmlFor="locationText">Shared location</FieldLabel>
          <Input id="locationText" name="locationText" placeholder="Clubhouse lawn" required />
          <FieldDescription>Use a shared space, never a private address.</FieldDescription>
          <FieldError>{state.fieldErrors?.locationText?.[0]}</FieldError>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
            <Input id="capacity" name="capacity" type="number" min="1" placeholder="40" />
            <FieldDescription>Leave blank for unlimited.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="volunteerSlots">Volunteer slots</FieldLabel>
            <Input id="volunteerSlots" name="volunteerSlots" type="number" min="0" placeholder="8" />
          </Field>
        </div>
      </FieldGroup>

      <FieldSet aria-label="Accessibility and language">
        <legend className="font-display text-base font-bold">Access and language</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {accessibilityOptions.map((option) => (
            <Field key={option} orientation="horizontal">
              <Checkbox id={`access-${option}`} name="accessibilityTags" value={option} aria-label={option} />
              <FieldLabel htmlFor={`access-${option}`}>{option}</FieldLabel>
            </Field>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {languageOptions.map((option) => (
            <Field key={option} orientation="horizontal">
              <Checkbox id={`language-${option}`} name="languages" value={option} defaultChecked={option === "English"} aria-label={option} />
              <FieldLabel htmlFor={`language-${option}`}>{option}</FieldLabel>
            </Field>
          ))}
        </div>
      </FieldSet>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === "success" ? (
        <Alert>
          <AlertDescription>
            {state.message}{" "}
            {state.eventId ? (
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => router.push(`/events/${state.eventId}`)}
              >
                Open event
              </button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" variant="cta" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Create event
      </Button>
    </form>
  )
}
