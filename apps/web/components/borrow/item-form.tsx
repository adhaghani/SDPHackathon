"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"

import { createItem } from "@/actions/borrow"
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
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"
import { MediaPoster } from "@/components/shared/media-poster"

const idleState = { status: "idle" } as const

export function ItemForm({
  categories,
}: {
  categories: Array<{ id: string; slug: string; name: string }>
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createItem, idleState)
  const [photoPath, setPhotoPath] = useState("/demo/item-placeholder.svg")
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: "", category: "", condition: "good", days: "3", deposit: "0" })
  const update = (key: keyof typeof draft, value: string) => setDraft((current) => ({ ...current, [key]: value }))

  async function handlePhoto(file: File | undefined) {
    if (!file) return
    setPhotoMessage(null)
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82))
      if (!blob) throw new Error("compression_failed")
      const path = `${crypto.randomUUID()}.webp`
      const { error } = await getBrowserClient().storage.from("item-photos").upload(path, blob, { upsert: true })
      if (error) throw error
      const { data } = getBrowserClient().storage.from("item-photos").getPublicUrl(path)
      setPhotoPath(data.publicUrl)
      setPhotoMessage("Photo compressed and uploaded.")
    } catch {
      setPhotoPath("/demo/item-placeholder.svg")
      setPhotoMessage("Photo upload is unavailable here, so the demo illustration will be used.")
    }
  }

  const categoryName = categories.find((category) => category.slug === draft.category)?.name
  const deposit = Number(draft.deposit || 0)
  const sectionClass = "bb-card flex flex-col gap-5 p-5 sm:p-6"
  const legendClass = "text-title float-left mb-1 w-full text-ink"

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <fieldset className={sectionClass}>
          <legend className={legendClass}>What are you lending?</legend>
          <FieldGroup>
            <Field data-invalid={Boolean(state.fieldErrors?.title)}>
              <FieldLabel htmlFor="item-title">Item title</FieldLabel>
              <Input id="item-title" name="title" required placeholder="Folding ladder" onChange={(event) => update("title", event.target.value)} />
              <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.categorySlug)}>
                <FieldLabel htmlFor="item-category">Category</FieldLabel>
                <NativeSelect id="item-category" name="categorySlug" className="w-full" required onChange={(event) => update("category", event.target.value)}>
                  <NativeSelectOption value="">Choose a category</NativeSelectOption>
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.slug}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError>{state.fieldErrors?.categorySlug?.[0]}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="item-condition">Condition</FieldLabel>
                <NativeSelect id="item-condition" name="condition" defaultValue="good" className="w-full" onChange={(event) => update("condition", event.target.value)}>
                  <NativeSelectOption value="like_new">Like new</NativeSelectOption>
                  <NativeSelectOption value="good">Good</NativeSelectOption>
                  <NativeSelectOption value="fair">Fair</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="item-description">Description</FieldLabel>
              <Textarea id="item-description" name="description" rows={4} placeholder="What's included, any quirks, how to use it safely" />
            </Field>
          </FieldGroup>
        </fieldset>

        <fieldset className={sectionClass}>
          <legend className={legendClass}>Photo</legend>
          <Field>
            <FieldLabel htmlFor="item-photo">Add a clear photo</FieldLabel>
            <Input
              id="item-photo"
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) setLocalPreview(URL.createObjectURL(file))
                void handlePhoto(file)
              }}
            />
            <FieldDescription>
              Compressed to about 1600 px before upload. A demo illustration is used if storage is unavailable.
            </FieldDescription>
            {photoMessage ? <p className="text-sm text-ink-muted" aria-live="polite">{photoMessage}</p> : null}
          </Field>
        </fieldset>

        <fieldset className={sectionClass}>
          <legend className={legendClass}>Lending terms</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="max-loan-days">Maximum loan days</FieldLabel>
              <Input id="max-loan-days" name="maxLoanDays" type="number" min="1" max="30" defaultValue="3" required onChange={(event) => update("days", event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="deposit">Deposit (RM)</FieldLabel>
              <Input id="deposit" name="depositRm" type="number" min="0" step="0.01" defaultValue="0" onChange={(event) => update("deposit", event.target.value)} />
              <FieldDescription>Recorded only. BorrowBetter never handles money.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="estimated-price">New price (RM, optional)</FieldLabel>
              <Input id="estimated-price" name="estimatedNewPriceRm" type="number" min="0" step="0.01" placeholder="250" />
              <FieldDescription>Used for estimated impact only.</FieldDescription>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="handover-option">Handover</FieldLabel>
            <Input id="handover-option" name="handoverOptions" defaultValue="Meet in a shared space" required />
            <FieldDescription>Name a shared space, like the lobby or Dewan Komuniti. Never a private address.</FieldDescription>
          </Field>
        </fieldset>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
        <div className="max-lg:hidden">
          <p className="text-eyebrow text-ink-muted">Preview</p>
          <div className="mt-2">
            <MediaPoster
              src={localPreview ?? photoPath}
              alt=""
              className="border border-hairline bg-sun-tint"
              badge={
                <span className={`rounded-full px-2.5 py-1 text-sm font-bold text-ink ${deposit > 0 ? "bg-surface" : "bg-mint-tint"}`}>
                  {deposit > 0 ? `RM ${deposit.toFixed(2)} deposit` : "Free"}
                </span>
              }
              sizes="22rem"
            />
            <p className="mt-2 font-display text-lg font-bold text-ink">{draft.title || "Your item title"}</p>
            <p className="text-sm text-ink-muted first-letter:uppercase">
              {draft.condition.replace("_", " ")} · up to {draft.days || "3"} days{categoryName ? ` · ${categoryName}` : ""}
            </p>
          </div>
        </div>
        <input type="hidden" name="photoPath" value={photoPath} />
        {state.status === "error" && state.message ? (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}
        {state.status === "success" ? (
          <Alert>
            <AlertDescription>
              {state.message}{" "}
              {state.itemId ? (
                <button type="button" className="font-bold underline underline-offset-4" onClick={() => router.push(`/borrow/items/${state.itemId}`)}>
                  View item
                </button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" variant="cta" size="cta" className="w-full" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          List item
        </Button>
        <p className="text-sm text-ink-muted">
          You earn BetterPoints when a loan is completed and both of you confirm the return.
        </p>
      </aside>
    </form>
  )
}
