"use client"

import { useActionState, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { suggestGiveawayListing, type SuggestGiveawayState } from "@/actions/ai"
import { createGiveaway } from "@/actions/giveaway"
import { PublicImageCropDialog } from "@/components/shared/public-image-crop-dialog"
import { ImageUploadInput } from "@/components/shared/image-upload-input"
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
const idleSuggestion: SuggestGiveawayState = { status: "idle" }

export function GiveawayForm({
  categories,
}: {
  categories: Array<{ id: string; slug: string; name: string }>
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createGiveaway, idleState)
  const [photoPath, setPhotoPath] = useState("/demo/item-placeholder.svg")
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [analysingPhoto, setAnalysingPhoto] = useState(false)
  const [suggestion, setSuggestion] =
    useState<SuggestGiveawayState>(idleSuggestion)
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    category: "",
    condition: "unusable" as "unusable" | "worn" | "good",
  })
  const editedRef = useRef({
    title: false,
    description: false,
    category: false,
    condition: false,
  })

  function markEdited(field: keyof typeof editedRef.current) {
    editedRef.current[field] = true
  }

  const [uploading, setUploading] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)

  async function handlePhoto(blob: Blob, file: File) {
    setUploading(true)
    setPhotoMessage("Uploading image…")
    setSuggestion(idleSuggestion)
    try {
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
      setAnalysingPhoto(true)

      const reader = new FileReader()
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result ?? ""))
        reader.onerror = () => reject(new Error("photo_read_failed"))
        reader.readAsDataURL(blob)
      })
      const suggestionForm = new FormData()
      suggestionForm.set("imageDataUrl", imageDataUrl)
      suggestionForm.set("fileName", file.name)
      const result = await suggestGiveawayListing(
        idleSuggestion,
        suggestionForm
      ).catch(() => ({
        status: "error" as const,
        message:
          "Photo uploaded. AI suggestions are unavailable, so please add the details manually.",
      }))
      setSuggestion(result)

      if (result.status === "success" && result.suggestion?.source === "ai") {
        const nextCategory = result.suggestion.categorySlug
        const currentEdits = editedRef.current
        setDraft((current) => ({
          title: currentEdits.title
            ? current.title
            : result.suggestion?.title || current.title,
          description: currentEdits.description
            ? current.description
            : result.suggestion?.description || current.description,
          category:
            !currentEdits.category &&
            categories.some((category) => category.slug === nextCategory)
              ? nextCategory
              : current.category,
          condition: currentEdits.condition
            ? current.condition
            : result.suggestion?.condition || current.condition,
        }))
      }
      setCropFile(null)
    } catch {
      setCropFile(null)
      setPhotoMessage(
        "Photo upload failed. Please try again. Your previous image is unchanged."
      )
    } finally {
      setAnalysingPhoto(false)
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
              value={draft.title}
              onChange={(event) => {
                markEdited("title")
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }}
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
              value={draft.description}
              onChange={(event) => {
                markEdited("description")
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="giveaway-photo">Photo</FieldLabel>
              <ImageUploadInput
                id="giveaway-photo"
                disabled={uploading || analysingPhoto || pending}
                hasImage={photoPath !== "/demo/item-placeholder.svg"}
                onFiles={(files) => {
                  const file = files[0]
                  if (file) setCropFile(file)
                }}
              />
              <FieldDescription>
                Optional. Upload a clear photo and AI can draft the item details
                for you.
              </FieldDescription>
              {photoMessage ? (
                <p className="text-sm text-ink-muted" aria-live="polite">
                  {photoMessage}
                </p>
              ) : null}
              <PublicImageCropDialog
                file={cropFile}
                title="Crop giveaway photo"
                aspectLabel="landscape 4:3"
                outputWidth={1200}
                outputHeight={900}
                onCancel={() => setCropFile(null)}
                onConfirm={handlePhoto}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="giveaway-condition">Condition</FieldLabel>
              <NativeSelect
                id="giveaway-condition"
                name="condition"
                value={draft.condition}
                className="w-full"
                onChange={(event) => {
                  markEdited("condition")
                  setDraft((current) => ({
                    ...current,
                    condition: event.target.value as typeof draft.condition,
                  }))
                }}
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
              value={draft.category}
              className="w-full"
              onChange={(event) => {
                markEdited("category")
                setDraft((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }}
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

          {analysingPhoto ? (
            <p
              className="flex items-center gap-2 rounded-lg bg-lilac-tint p-3 text-sm font-bold text-ink"
              aria-live="polite"
              aria-busy="true"
            >
              <Spinner data-icon="inline-start" />
              AI is creating your listing details…
            </p>
          ) : suggestion.message ? (
            <p
              className="rounded-lg bg-lilac-tint p-3 text-sm text-ink"
              aria-live="polite"
            >
              {suggestion.message}
            </p>
          ) : null}
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
        <Button
          type="submit"
          variant="cta"
          size="cta"
          disabled={pending || uploading}
        >
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
