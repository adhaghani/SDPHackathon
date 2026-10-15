"use client"

import { useActionState, useState } from "react"
import Image from "next/image"

import { saveItemGuide } from "@/actions/guides"
import { prepareImageForUpload } from "@/lib/media"
import { getBrowserClient } from "@/lib/supabase/browser"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldDescription, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
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

  async function handlePhotos(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setUploadMessage("Uploading photos…")
    const nextPaths = [...photoPaths]
    try {
      for (const file of Array.from(files).slice(0, 3 - nextPaths.length)) {
        const blob = await prepareImageForUpload(file, { maxDimension: 1400 })
        const path = `guides/${crypto.randomUUID()}.webp`
        const { error } = await getBrowserClient()
          .storage.from("item-photos")
          .upload(path, blob, { upsert: true })
        if (error) throw error
        const { data } = getBrowserClient().storage.from("item-photos").getPublicUrl(path)
        nextPaths.push(data.publicUrl)
      }
      setPhotoPaths(nextPaths.slice(0, 3))
      setUploadMessage(`${nextPaths.slice(0, 3).length} photos ready. EXIF data was removed.`)
    } catch {
      setPhotoPaths(nextPaths.slice(0, 3))
      setUploadMessage("A photo could not be uploaded. Try a smaller image or continue without it.")
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
        <FieldDescription>Up to 1,000 characters. Short steps work best.</FieldDescription>
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
        <Input
          id="guide-photos"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={pending || uploading || photoPaths.length >= 3}
          multiple
          onChange={(event) => void handlePhotos(event.target.files)}
        />
        <FieldDescription>
          Up to three photos. Images are re-encoded before upload to remove EXIF and GPS metadata.
        </FieldDescription>
        <div className="grid grid-cols-3 gap-3">
          {photoPaths.map((src, index) => (
            <div key={src} className="relative aspect-[4/3]">
              <Image unoptimized src={src} alt={`Guide photo ${index + 1}`} fill sizes="33vw" className="rounded-lg object-contain" />
            </div>
          ))}
        </div>
        {photoPaths.length ? (
          <p className="text-sm font-bold text-ink">{photoPaths.length} of 3 photos attached</p>
        ) : null}
        {uploadMessage ? <p className="text-sm text-ink-muted">{uploadMessage}</p> : null}
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
