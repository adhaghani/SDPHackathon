"use client"

import { useActionState, useState } from "react"

import { createPartnerChallenge, createPartnerReward } from "@/actions/sponsor"
import { PublicImageCropDialog } from "@/components/shared/public-image-crop-dialog"
import { getBrowserClient } from "@/lib/supabase/browser"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { DateField } from "@/components/forms/date-field"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function SponsorRewardForm() {
  const [state, action, pending] = useActionState(
    createPartnerReward,
    idleState
  )
  const [imagePath, setImagePath] = useState("/demo/reward-voucher.svg")
  const [imageMessage, setImageMessage] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)

  async function handleImage(blob: Blob) {
    setUploading(true)
    setImageMessage("Uploading image…")
    try {
      const path = `sponsors/${crypto.randomUUID()}.webp`
      const { error } = await getBrowserClient()
        .storage.from("item-photos")
        .upload(path, blob, { upsert: true })
      if (error) throw error
      const { data } = getBrowserClient()
        .storage.from("item-photos")
        .getPublicUrl(path)
      setImagePath(data.publicUrl)
      setImageMessage("Reward image compressed and uploaded.")
      setCropFile(null)
    } catch {
      setCropFile(null)
      setImageMessage(
        "Image upload failed. Please try again. Your previous image is unchanged."
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="imagePath" value={imagePath} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="sponsor-reward-image">Image</FieldLabel>
          <Input
            id="sponsor-reward-image"
            type="file"
            disabled={uploading || pending}
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) setCropFile(file)
            }}
          />
          <p className="text-sm text-muted-foreground">
            Optional. A themed reward poster is used as a fallback.
          </p>
          {imageMessage ? (
            <p className="text-sm text-muted-foreground">{imageMessage}</p>
          ) : null}
        </Field>
        <PublicImageCropDialog
          file={cropFile}
          title="Crop reward image"
          aspectLabel="wide 2:1"
          outputWidth={1200}
          outputHeight={600}
          onCancel={() => setCropFile(null)}
          onConfirm={handleImage}
        />
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="sponsor-reward-title">Reward title</FieldLabel>
          <Input id="sponsor-reward-title" name="title" required />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="sponsor-reward-description">
            Description
          </FieldLabel>
          <Textarea
            id="sponsor-reward-description"
            name="description"
            rows={3}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sponsor-reward-cost">Cost (BP)</FieldLabel>
            <Input
              id="sponsor-reward-cost"
              name="costBp"
              type="number"
              min="1"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sponsor-reward-stock">Stock</FieldLabel>
            <Input
              id="sponsor-reward-stock"
              name="stock"
              type="number"
              min="1"
              defaultValue="10"
              required
            />
          </Field>
        </div>
      </FieldGroup>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        variant="cta"
        className="h-11"
        disabled={pending || uploading}
      >
        {pending ? <Spinner data-icon="inline-start" /> : null}Create reward
      </Button>
    </form>
  )
}

export function SponsorChallengeForm() {
  const [state, action, pending] = useActionState(
    createPartnerChallenge,
    idleState
  )
  return (
    <form action={action} className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="sponsor-challenge-title">
            Challenge title
          </FieldLabel>
          <Input id="sponsor-challenge-title" name="title" required />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="sponsor-challenge-description">
            Description
          </FieldLabel>
          <Textarea
            id="sponsor-challenge-description"
            name="description"
            rows={3}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="sponsor-challenge-target">Target</FieldLabel>
            <Input
              id="sponsor-challenge-target"
              name="target"
              type="number"
              min="1"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sponsor-challenge-reward">
              Reward BP
            </FieldLabel>
            <Input
              id="sponsor-challenge-reward"
              name="rewardPoints"
              type="number"
              min="0"
              defaultValue="100"
              required
            />
          </Field>
          <DateField
            id="sponsor-challenge-ends"
            name="endsAt"
            label="Ends"
            required
          />
        </div>
      </FieldGroup>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}Create challenge
      </Button>
    </form>
  )
}
