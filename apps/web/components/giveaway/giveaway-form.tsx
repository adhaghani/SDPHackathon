"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"

import { createGiveaway } from "@/actions/giveaway"
import { prepareImageForUpload } from "@/lib/media"
import { getBrowserClient } from "@/lib/supabase/browser"
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function GiveawayForm({
  categories,
}: {
  categories: Array<{ id: string; slug: string; name: string }>
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createGiveaway, idleState)
  const [photoPath, setPhotoPath] = useState("/demo/item-placeholder.svg")
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)

  async function handlePhoto(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setPhotoMessage("Uploading image…")
    try {
      const blob = await prepareImageForUpload(file, {
        maxDimension: 1600,
        quality: 0.82,
      })
      const path = `giveaways/${crypto.randomUUID()}.webp`
      const { error } = await getBrowserClient()
        .storage.from("item-photos")
        .upload(path, blob, { upsert: true })
      if (error) throw error
      const { data } = getBrowserClient()
        .storage.from("item-photos")
        .getPublicUrl(path)
      setPhotoPath(data.publicUrl)
      setPhotoMessage("Photo compressed and uploaded.")
    } catch {
      setPhotoMessage(
        "Photo upload failed. Please try again. Your previous image is unchanged."
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="photoPath" value={photoPath} />
      <div className="bb-card flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <p className="text-tag text-ink-muted">Giveaway listing</p>
          <h2 className="mt-1 text-title text-ink">What are you letting go?</h2>
          <p className="mt-2 max-w-[65ch] text-sm text-ink-muted">
            Old, unused or no longer working things can still be useful to a
            neighbour. Listings are always free.
          </p>
        </div>

        <FieldGroup>
          <Field data-invalid={Boolean(state.fieldErrors?.title)}>
            <FieldLabel htmlFor="giveaway-title">Item title</FieldLabel>
            <Input
              id="giveaway-title"
              name="title"
              required
              placeholder="Desk fan that no longer spins"
              aria-invalid={Boolean(state.fieldErrors?.title)}
            />
            <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="giveaway-description">
              What should the taker know?
            </FieldLabel>
            <Textarea
              id="giveaway-description"
              name="description"
              rows={4}
              placeholder="Mention what still works, what is broken, and anything useful for a repair or parts."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="giveaway-photo">Photo</FieldLabel>
              <Input
                id="giveaway-photo"
                type="file"
                disabled={uploading || pending}
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void handlePhoto(event.target.files?.[0])}
              />
              <FieldDescription>
                Optional. Images are compressed before upload.
              </FieldDescription>
              {photoMessage ? (
                <p className="text-sm text-ink-muted">{photoMessage}</p>
              ) : null}
            </Field>

            <Field>
              <FieldLabel htmlFor="giveaway-condition">Condition</FieldLabel>
              <NativeSelect
                id="giveaway-condition"
                name="condition"
                defaultValue="unusable"
                className="w-full"
              >
                <NativeSelectOption value="unusable">
                  Unusable / for parts
                </NativeSelectOption>
                <NativeSelectOption value="worn">
                  Worn but working
                </NativeSelectOption>
                <NativeSelectOption value="good">
                  Good condition
                </NativeSelectOption>
              </NativeSelect>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="giveaway-category">Category</FieldLabel>
            <NativeSelect
              id="giveaway-category"
              name="categorySlug"
              defaultValue=""
              className="w-full"
            >
              <NativeSelectOption value="">
                Choose a category
              </NativeSelectOption>
              {categories.map((category) => (
                <NativeSelectOption key={category.id} value={category.slug}>
                  {category.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </FieldGroup>
      </div>

      <div className="bb-card flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <p className="text-tag text-ink-muted">Handover</p>
          <h2 className="mt-1 text-title text-ink">
            Where should it change hands?
          </h2>
        </div>

        <FieldGroup>
          <Field data-invalid={Boolean(state.fieldErrors?.handoverLocation)}>
            <FieldLabel htmlFor="giveaway-location">
              Shared handover spot
            </FieldLabel>
            <Input
              id="giveaway-location"
              name="handoverLocation"
              defaultValue="Shared township space"
              placeholder="Lobby, community room, guarded drop-off point…"
              aria-invalid={Boolean(state.fieldErrors?.handoverLocation)}
            />
            <FieldError>{state.fieldErrors?.handoverLocation?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="giveaway-notes">Pickup notes</FieldLabel>
            <Textarea
              id="giveaway-notes"
              name="handoverNotes"
              rows={3}
              placeholder="Optional pickup window or handover notes."
            />
          </Field>
        </FieldGroup>

        <div className="rounded-lg bg-mint-tint p-4 text-sm text-ink">
          <strong>Both sides can earn BetterPoints.</strong> The giver and taker
          each earn 3 BP once the handover is confirmed by both people. The
          small reward, two-sided confirmation, and daily limit help keep the
          exchange genuine.
        </div>
      </div>

      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="cta" size="cta" disabled={pending || uploading}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Publish giveaway
        </Button>
        {state.status === "success" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/giveaway")}
          >
            Browse giveaways
          </Button>
        ) : null}
      </div>
    </form>
  )
}
