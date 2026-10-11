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

  return (
    <form action={action} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="item-photo">Photo</FieldLabel>
          <Input
            id="item-photo"
            name="photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => void handlePhoto(event.target.files?.[0])}
          />
          <FieldDescription>
            Images are compressed to about 1600 px before upload. A demo illustration is used if storage is unavailable.
          </FieldDescription>
          {photoMessage ? <p className="text-sm text-muted-foreground">{photoMessage}</p> : null}
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.title)}>
          <FieldLabel htmlFor="item-title">Item title</FieldLabel>
          <Input id="item-title" name="title" required placeholder="Folding ladder" />
          <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="item-description">Description</FieldLabel>
          <Textarea id="item-description" name="description" rows={4} />
        </Field>
        <Field data-invalid={Boolean(state.fieldErrors?.categorySlug)}>
          <FieldLabel htmlFor="item-category">Category</FieldLabel>
          <NativeSelect id="item-category" name="categorySlug" className="w-full" required>
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
          <NativeSelect id="item-condition" name="condition" defaultValue="good" className="w-full">
            <NativeSelectOption value="like_new">Like new</NativeSelectOption>
            <NativeSelectOption value="good">Good</NativeSelectOption>
            <NativeSelectOption value="fair">Fair</NativeSelectOption>
          </NativeSelect>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="estimated-price">Estimated new price (RM)</FieldLabel>
            <Input id="estimated-price" name="estimatedNewPriceRm" type="number" min="0" step="0.01" placeholder="250" />
            <FieldDescription>Optional. Used for estimated impact only.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="deposit">Deposit (RM)</FieldLabel>
            <Input id="deposit" name="depositRm" type="number" min="0" step="0.01" defaultValue="0" />
            <FieldDescription>Recorded only. BorrowBetter never handles money.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="max-loan-days">Maximum loan days</FieldLabel>
            <Input id="max-loan-days" name="maxLoanDays" type="number" min="1" max="30" defaultValue="3" required />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="handover-option">Handover option</FieldLabel>
          <Input id="handover-option" name="handoverOptions" defaultValue="Meet in a shared space" required />
          <FieldDescription>Never share a private address in the listing.</FieldDescription>
        </Field>
      </FieldGroup>
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
              <button type="button" className="underline underline-offset-4" onClick={() => router.push(`/borrow/items/${state.itemId}`)}>
                View item
              </button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        List item
      </Button>
    </form>
  )
}
