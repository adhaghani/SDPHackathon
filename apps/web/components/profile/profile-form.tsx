"use client"

import { useActionState } from "react"
import { toast } from "sonner"

import { updateProfile, type ProfileActionState } from "@/actions/profile"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

async function updateProfileWithFeedback(
  state: ProfileActionState,
  formData: FormData
) {
  const result = await updateProfile(state, formData)
  if (result.status === "success") {
    toast.success("Profile updated.", { id: "profile-updated" })
  }
  return result
}

export function ProfileForm({
  profile,
}: {
  profile: {
    display_name: string
    interests: string[]
    comfort_prefs: unknown
    recognition_opt_in: boolean
    show_in_highlights: boolean
  }
}) {
  const [state, action, pending] = useActionState(updateProfileWithFeedback, idleState)
  const prefs =
    profile.comfort_prefs && typeof profile.comfort_prefs === "object" && !Array.isArray(profile.comfort_prefs)
      ? (profile.comfort_prefs as Record<string, unknown>)
      : {}

  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.displayName)}>
          <FieldLabel htmlFor="displayName">Display name</FieldLabel>
          <Input id="displayName" name="displayName" defaultValue={profile.display_name} required />
          <FieldDescription>Your display name is visible to co-members.</FieldDescription>
          <FieldError>{state.fieldErrors?.displayName?.[0]}</FieldError>
        </Field>
      </FieldGroup>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-display text-base font-bold">Comfort settings</legend>
        <Field orientation="horizontal">
          <Checkbox id="largeText" name="largeText" defaultChecked={Boolean(prefs.large_text)} aria-label="Larger text" />
          <FieldLabel htmlFor="largeText">Larger text</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="highContrast" name="highContrast" defaultChecked={Boolean(prefs.high_contrast)} aria-label="High contrast" />
          <FieldLabel htmlFor="highContrast">High contrast</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="reduceMotion" name="reduceMotion" defaultChecked={Boolean(prefs.reduce_motion)} aria-label="Reduce motion" />
          <FieldLabel htmlFor="reduceMotion">Reduce motion</FieldLabel>
        </Field>
      </fieldset>

      <Field orientation="horizontal">
        <Checkbox id="recognitionOptIn" name="recognitionOptIn" defaultChecked={profile.recognition_opt_in} aria-label="Opt in to recognition wall" />
        <FieldLabel htmlFor="recognitionOptIn">Show my first name and badges on the recognition wall</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox
          id="showInHighlights"
          name="showInHighlights"
          defaultChecked={profile.show_in_highlights}
          aria-label="Opt in to monthly neighbour highlights"
        />
        <FieldLabel htmlFor="showInHighlights">
          Let organisers consider me for Neighbour of the month
        </FieldLabel>
      </Field>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save profile
      </Button>
    </form>
  )
}
