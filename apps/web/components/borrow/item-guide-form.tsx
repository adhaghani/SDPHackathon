"use client"

import { useActionState, useState } from "react"
import { PublicImage as Image } from "@/components/shared/public-image"

import { saveItemGuide } from "@/actions/guides"
import { PublicImageCropDialog } from "@/components/shared/public-image-crop-dialog"
import { ImageUploadInput } from "@/components/shared/image-upload-input"
import { getBrowserClient } from "@/lib/supabase/browser"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const

export function ItemGuideForm({
  itemId,
  initialBody = "",
  initialSafetyNote = "",
  initialPhotoPaths = [],
}: {
  itemId: string
  initialBody?: string
  initialSafetyNote?: string
  initialPhotoPaths?: string[]
}) {
  const [state, action, pending] = useActionState(saveItemGuide, idleState)
  const [photoPaths, setPhotoPaths] = useState(initialPhotoPaths)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const [cropFiles, setCropFiles] = useState<File[]>([])

  async function handleCroppedPhoto(blob: Blob) {
    setUploading(true)
    setUploadMessage("Uploading cropped photo…")
    try {
      const path = `guides/${crypto.randomUUID()}.webp`
      const { error } = await getBrowserClient()
        .storage.from("item-photos")
        .upload(path, blob, { upsert: true })
      if (error) throw error
      const { data } = getBrowserClient()
        .storage.from("item-photos")
        .getPublicUrl(path)
      setPhotoPaths((current) => {
        const next = [...current, data.publicUrl].slice(0, 3)
        setUploadMessage(`${next.length} photos ready. EXIF data was removed.`)
        return next
      })
      setCropFiles((current) => current.slice(1))
    } catch {
      setUploadMessage(
        "A photo could not be uploaded. Try a smaller image or continue without it."
      )
      throw new Error("guide_photo_upload_failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="itemId" value={itemId} />
      {photoPaths.map((path) => (
        <input key={path} type="hidden" name="photoPaths" value={path} />
      ))}
      <Field>
        <FieldLabel htmlFor="guide-body">How to use it</FieldLabel>
        <Textarea
          id="guide-body"
          name="body"
          rows={5}
          maxLength={1000}
          defaultValue={initialBody}
          required
          placeholder="Unfold the ladder, lock both feet, and keep it on level ground."
        />
        <FieldDescription>
          Up to 1,000 characters. Short steps work best.
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="guide-safety">Safety note</FieldLabel>
        <Textarea
          id="guide-safety"
          name="safetyNote"
          rows={2}
          maxLength={600}
          defaultValue={initialSafetyNote}
          placeholder="Optional warning or safety instruction"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="guide-photos">Photos</FieldLabel>
        <ImageUploadInput
          id="guide-photos"
          disabled={pending || uploading || photoPaths.length >= 3}
          multiple
          hasImage={photoPaths.length > 0}
          onFiles={(files) => {
            const available = Math.max(0, 3 - photoPaths.length)
            setCropFiles(files.slice(0, available))
          }}
        />
        <FieldDescription>
          Up to three photos. Images are re-encoded before upload to remove EXIF
          and GPS metadata.
        </FieldDescription>
        <div className="grid grid-cols-3 gap-3">
          {photoPaths.map((src, index) => (
            <div key={src} className="relative aspect-[4/3]">
              <Image
                src={src}
                alt={`Guide photo ${index + 1}`}
                fill
                sizes="33vw"
                className="rounded-lg object-contain"
              />
            </div>
          ))}
        </div>
        {photoPaths.length ? (
          <p className="text-sm font-bold text-ink">
            {photoPaths.length} of 3 photos attached
          </p>
        ) : null}
        {uploadMessage ? (
          <p className="text-sm text-ink-muted">{uploadMessage}</p>
        ) : null}
        <PublicImageCropDialog
          file={cropFiles[0] ?? null}
          title={`Crop guide photo ${photoPaths.length + 1}`}
          aspectLabel="landscape 4:3"
          outputWidth={1200}
          outputHeight={900}
          onCancel={() => setCropFiles([])}
          onConfirm={handleCroppedPhoto}
        />
      </Field>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending || uploading}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save how-to guide
      </Button>
    </form>
  )
}
