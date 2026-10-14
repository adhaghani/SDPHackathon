"use client"

import { useActionState, useEffect, useMemo, useRef, useState } from "react"
import { CheckIcon, MinusIcon, PlusIcon, RecycleIcon, Trash2Icon } from "lucide-react"

import { logRecyclingAction } from "@/actions/recycling"
import type { RecyclingMaterial } from "@/components/recycling/types"
import { prepareImageForUpload } from "@/lib/media"
import { getBrowserClient } from "@/lib/supabase/browser"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

const idleState = { status: "idle" } as const

function clampQuantity(value: string) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return 0
  return Math.max(0, Math.min(500, parsed))
}

function clampKg(value: string) {
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) return 0
  return Math.max(0, Math.min(100, parsed))
}

export function RecyclingLogDialog({
  materials,
  townshipId,
  currentDate,
}: {
  materials: RecyclingMaterial[]
  townshipId: string
  currentDate: string
}) {
  const formattedDate = new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "medium",
  }).format(new Date(`${currentDate}T00:00:00`))

  return (
    <section aria-labelledby="new-estimate-heading" className="bb-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-eyebrow text-ink-muted">New estimate</p>
          <h2 id="new-estimate-heading" className="text-h2 mt-1 text-ink">
            What did you recycle?
          </h2>
          <p className="mt-1 max-w-[58ch] text-body text-ink-soft">
            Pick common items for a quick estimate, or switch to custom kg when you already know the weight.
          </p>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button variant="cta" className="shrink-0">
                <RecycleIcon aria-hidden="true" className="size-4" />
                Log recycling
              </Button>
            }
          />
          <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
            <DialogHeader className="px-5 pt-5 pb-1">
              <DialogTitle>New recycling estimate</DialogTitle>
              <DialogDescription>
                This estimate is for {formattedDate}. Photos are optional and EXIF data is removed before upload.
              </DialogDescription>
            </DialogHeader>
            <RecyclingLogForm materials={materials} townshipId={townshipId} currentDate={currentDate} />
          </DialogContent>
        </Dialog>
      </div>
      <p className="mt-4 text-xs text-ink-soft">
        You can log estimates for today only. Counts are converted to kilograms on the server.
      </p>
    </section>
  )
}

export function RecyclingLogForm({
  materials,
  townshipId,
  currentDate,
}: {
  materials: RecyclingMaterial[]
  townshipId: string
  currentDate: string
}) {
  const [state, formAction, pending] = useActionState(logRecyclingAction, idleState)
  const [method, setMethod] = useState<"count" | "custom_kg">("count")
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [weights, setWeights] = useState<Record<string, string>>({})
  const [photoPaths, setPhotoPaths] = useState<string[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const photoPreviewsRef = useRef(photoPreviews)

  useEffect(() => {
    photoPreviewsRef.current = photoPreviews
  }, [photoPreviews])

  useEffect(() => () => photoPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url)), [])

  const countLines = useMemo(
    () =>
      materials.flatMap((material) =>
        material.units
          .map((unit) => ({
            kind: "count" as const,
            unitId: unit.id,
            quantity: clampQuantity(quantities[unit.id] ?? ""),
            kgPerUnit: unit.kgPerUnit,
          }))
          .filter((line) => line.quantity > 0)
      ),
    [materials, quantities]
  )

  const customLines = useMemo(
    () =>
      materials
        .map((material) => ({
          kind: "custom_kg" as const,
          materialId: material.id,
          kg: clampKg(weights[material.slug] ?? ""),
        }))
        .filter((line) => line.kg > 0),
    [materials, weights]
  )

  const activeLines = method === "count" ? countLines : customLines
  const previewKg =
    method === "count"
      ? countLines.reduce((sum, line) => sum + line.quantity * line.kgPerUnit, 0)
      : customLines.reduce((sum, line) => sum + line.kg, 0)
  const canSubmit = activeLines.length > 0 && previewKg > 0 && !pending && !uploading

  function updateQuantity(unitId: string, next: number) {
    setQuantities((current) => ({
      ...current,
      [unitId]: String(Math.max(0, Math.min(500, next))),
    }))
  }

  function updateWeight(slug: string, value: string) {
    setWeights((current) => ({ ...current, [slug]: value }))
  }

  async function handlePhotos(files: File[] | null) {
    if (!files?.length) return
    setUploadMessage(null)
    const available = 3 - photoPaths.length
    if (available <= 0) {
      setUploadMessage("Three photos is the maximum.")
      return
    }

    setUploading(true)
    const nextPaths = [...photoPaths]
    const nextPreviews = [...photoPreviews]
    try {
      for (const file of files.slice(0, available)) {
        const blob = await prepareImageForUpload(file, { maxDimension: 1400 })
        const path = `recycling/${crypto.randomUUID()}.webp`
        const { error } = await getBrowserClient()
          .storage.from("item-photos")
          .upload(path, blob, { upsert: true })
        if (error) throw error
        const { data } = getBrowserClient().storage.from("item-photos").getPublicUrl(path)
        nextPaths.push(data.publicUrl)
        nextPreviews.push(URL.createObjectURL(file))
      }
      setPhotoPaths(nextPaths)
      setPhotoPreviews(nextPreviews)
      setUploadMessage(`${nextPaths.length} of 3 photos attached. EXIF data was removed.`)
    } catch {
      setUploadMessage("A photo could not be uploaded. Try a smaller image or continue without it.")
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(index: number) {
    const removedPreview = photoPreviews[index]
    if (removedPreview) URL.revokeObjectURL(removedPreview)
    setPhotoPaths((current) => current.filter((_, currentIndex) => currentIndex !== index))
    setPhotoPreviews((current) => current.filter((_, currentIndex) => currentIndex !== index))
    setUploadMessage(null)
  }

  return (
    <form action={formAction} className="px-5 pb-5">
      <input type="hidden" name="townshipId" value={townshipId} />
      <input type="hidden" name="method" value={method} />
      <input type="hidden" name="occurredOn" value={currentDate} />
      <input type="hidden" name="lines" value={JSON.stringify(activeLines)} />
      {photoPaths.map((path) => (
        <input key={path} type="hidden" name="photoPaths" value={path} />
      ))}

      <div
        role="group"
        aria-label="Estimate method"
        className="mt-3 flex shrink-0 rounded-full border border-hairline bg-white p-1"
      >
        <button
          type="button"
          aria-pressed={method === "count"}
          onClick={() => setMethod("count")}
          className={cn(
            "min-h-10 flex-1 rounded-full px-3 text-sm font-bold transition-colors",
            method === "count" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
          )}
        >
          Count items
        </button>
        <button
          type="button"
          aria-pressed={method === "custom_kg"}
          onClick={() => setMethod("custom_kg")}
          className={cn(
            "min-h-10 flex-1 rounded-full px-3 text-sm font-bold transition-colors",
            method === "custom_kg" ? "bg-ink text-white" : "text-ink-soft hover:text-ink"
          )}
        >
          Custom kg
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-mint-tint px-4 py-3">
        <p className="text-sm font-bold text-ink">Estimated total</p>
        <p className="font-display text-2xl leading-7 font-extrabold text-ink tabular-nums">
          {previewKg.toLocaleString("en-MY", { maximumFractionDigits: 2 })} kg
        </p>
      </div>

      <div className="mt-5 border-t border-hairline pt-5">
        <label htmlFor="recycling-photos" className="text-sm font-bold text-ink">
          Photos (optional)
        </label>
        <p className="mt-1 text-xs text-ink-soft">
          Up to three photos. Images are re-encoded to remove EXIF and GPS metadata.
        </p>
        <Input
          id="recycling-photos"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="mt-3"
          disabled={uploading || photoPaths.length >= 3}
          onChange={(event) => {
            const files = event.target.files ? Array.from(event.target.files) : []
            event.target.value = ""
            void handlePhotos(files)
          }}
        />
        {photoPreviews.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {photoPreviews.map((preview, index) => (
              <li key={preview} className="relative size-20 overflow-hidden rounded-[12px] border border-hairline bg-white">
                <div
                  aria-label={`Recycling photo ${index + 1}`}
                  role="img"
                  className="size-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${preview}")` }}
                />
                <button
                  type="button"
                  aria-label={`Remove recycling photo ${index + 1}`}
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-ink/85 text-white hover:bg-ink"
                >
                  <Trash2Icon aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {uploadMessage ? <p className="mt-2 text-sm text-ink-muted" aria-live="polite">{uploadMessage}</p> : null}
      </div>

      {method === "count" ? (
        <div className="mt-6 space-y-6">
          {materials.map((material) => (
            <fieldset key={material.id} className="min-w-0">
              <legend className="text-title text-ink">{material.name}</legend>
              <div className="mt-2 divide-y divide-hairline border-y border-hairline">
                {material.units.map((unit) => {
                  const quantity = quantities[unit.id] ?? ""
                  return (
                    <div key={unit.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1 basis-52">
                        <label htmlFor={`unit-${unit.id}`} className="block text-sm font-bold text-ink">
                          {unit.name}
                        </label>
                        <p className="mt-0.5 text-xs text-ink-soft">
                          ≈ {unit.kgPerUnit.toLocaleString("en-MY", { maximumFractionDigits: 3 })} kg per {unit.unitLabel}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Remove one ${unit.name}`}
                          onClick={() => updateQuantity(unit.id, clampQuantity(quantity) - 1)}
                          className="grid size-10 place-items-center rounded-full border border-hairline bg-white text-ink transition-colors hover:bg-mint-tint"
                        >
                          <MinusIcon aria-hidden="true" className="size-4" />
                        </button>
                        <Input
                          id={`unit-${unit.id}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={500}
                          value={quantity}
                          onChange={(event) => updateQuantity(unit.id, clampQuantity(event.target.value))}
                          className="w-20 text-center"
                          aria-label={`${unit.name} quantity`}
                        />
                        <button
                          type="button"
                          aria-label={`Add one ${unit.name}`}
                          onClick={() => updateQuantity(unit.id, clampQuantity(quantity) + 1)}
                          className="grid size-10 place-items-center rounded-full border border-hairline bg-white text-ink transition-colors hover:bg-mint-tint"
                        >
                          <PlusIcon aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-ink-soft">
            Enter an estimate for each material you recycled. You can use decimals.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {materials.map((material) => (
              <label key={material.id} className="rounded-[14px] border border-hairline bg-white p-3">
                <span className="block text-sm font-bold text-ink">{material.name}</span>
                <span className="mt-2 flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.1"
                    value={weights[material.slug] ?? ""}
                    onChange={(event) => updateWeight(material.slug, event.target.value)}
                    aria-label={`${material.name} estimated kilograms`}
                  />
                  <span className="text-sm font-bold text-ink-muted">kg</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"} className="mt-5">
          <AlertDescription className="flex items-start gap-2">
            {state.status === "success" ? <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : null}
            <span>{state.message}</span>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 border-t border-hairline pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-soft">
          Estimates are private to you and capped at 100 kg per resident per day.
        </p>
        <div className="flex shrink-0 gap-2">
          <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
          <Button type="submit" variant="cta" disabled={!canSubmit}>
            {pending || uploading ? <Spinner data-icon="inline-start" /> : <RecycleIcon aria-hidden="true" className="size-4" />}
            Save estimate
          </Button>
        </div>
      </div>
    </form>
  )
}
