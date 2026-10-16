"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"

import { createEvent } from "@/actions/events"
import { PublicImageCropDialog } from "@/components/shared/public-image-crop-dialog"
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
import { DateField } from "@/components/forms/date-field"
import { DateTimeField } from "@/components/forms/date-time-field"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const
const accessibilityOptions = [
  "step-free",
  "seated or low-impact",
  "quiet",
  "family-friendly",
]
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

  const [uploading, setUploading] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)

  async function handleCover(blob: Blob) {
    setUploading(true)
    setCoverMessage("Uploading image…")
    try {
      const path = `events/${crypto.randomUUID()}.webp`
      const { error } = await getBrowserClient()
        .storage.from("item-photos")
        .upload(path, blob, { upsert: true })
      if (error) throw error
      const { data } = getBrowserClient()
        .storage.from("item-photos")
        .getPublicUrl(path)
      setCoverPath(data.publicUrl)
      setCoverMessage("Cover image compressed and uploaded.")
      setCropFile(null)
    } catch {
      setCropFile(null)
      setCoverMessage(
        "Cover upload failed. Please try again. Your previous image is unchanged."
      )
    } finally {
      setUploading(false)
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
            type="file"
            disabled={uploading || pending}
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) setCropFile(file)
            }}
          />
          <FieldDescription>
            Optional. Images are compressed before upload; a themed poster is
            used as a fallback.
          </FieldDescription>
          {coverMessage ? (
            <p className="text-sm text-muted-foreground">{coverMessage}</p>
          ) : null}
        </Field>
        <PublicImageCropDialog
          file={cropFile}
          title="Crop event cover"
          aspectLabel="portrait 3:4"
          outputWidth={900}
          outputHeight={1200}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCover}
        />
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="title">Event title</FieldLabel>
          <Input
            id="title"
            name="title"
            required
            aria-invalid={Boolean(state.fieldErrors?.title)}
          />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea id="description" name="description" rows={4} />
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.categorySlug)}>
          <FieldLabel htmlFor="categorySlug">Category</FieldLabel>
          <NativeSelect
            id="categorySlug"
            name="categorySlug"
            className="w-full"
            required
          >
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
          <DateTimeField
            id="startsAt"
            name="startsAt"
            label="Starts"
            required
            error={state.fieldErrors?.startsAt?.[0]}
          />
          <DateTimeField
            id="endsAt"
            name="endsAt"
            label="Ends"
            required
            error={state.fieldErrors?.endsAt?.[0]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="event-recurrence">Repeat</FieldLabel>
            <NativeSelect
              id="event-recurrence"
              name="recurrence"
              defaultValue="none"
              className="w-full"
            >
              <NativeSelectOption value="none">
                Does not repeat
              </NativeSelectOption>
              <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
              <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="event-recurrence-until">
              Repeat until
            </FieldLabel>
            <DateField
              id="event-recurrence-until"
              name="recurrenceUntil"
              label="Repeat until"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="event-recurrence-interval">
              Interval days
            </FieldLabel>
            <Input
              id="event-recurrence-interval"
              name="recurrenceIntervalDays"
              type="number"
              min="1"
              max="60"
              placeholder="7"
            />
          </Field>
        </div>
        <Field data-invalid={Boolean(state.fieldErrors?.locationText)}>
          <FieldLabel htmlFor="locationText">Shared location</FieldLabel>
          <Input
            id="locationText"
            name="locationText"
            placeholder="Clubhouse lawn"
            required
          />
          <FieldDescription>
            Use a shared space, never a private address.
          </FieldDescription>
          <FieldError>{state.fieldErrors?.locationText?.[0]}</FieldError>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="capacity">Capacity</FieldLabel>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              placeholder="40"
            />
            <FieldDescription>Leave blank for unlimited.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="volunteerSlots">Volunteer slots</FieldLabel>
            <Input
              id="volunteerSlots"
              name="volunteerSlots"
              type="number"
              min="0"
              placeholder="8"
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldSet aria-label="Accessibility and language">
        <legend className="font-display text-base font-bold">
          Access and language
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {accessibilityOptions.map((option) => (
            <Field key={option} orientation="horizontal">
              <Checkbox
                id={`access-${option}`}
                name="accessibilityTags"
                value={option}
                aria-label={option}
              />
              <FieldLabel htmlFor={`access-${option}`}>{option}</FieldLabel>
            </Field>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {languageOptions.map((option) => (
            <Field key={option} orientation="horizontal">
              <Checkbox
                id={`language-${option}`}
                name="languages"
                value={option}
                defaultChecked={option === "English"}
                aria-label={option}
              />
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

      <Button
        type="submit"
        variant="cta"
        className="h-11"
        disabled={pending || uploading}
      >
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Create event
      </Button>
    </form>
  )
}
