"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"

import { createItem } from "@/actions/borrow"
import { suggestListing, type SuggestListingState } from "@/actions/ai"
import { prepareImageForUpload } from "@/lib/media"
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
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"
import { MediaPoster } from "@/components/shared/media-poster"

const idleState = { status: "idle" } as const
const idleSuggestion: SuggestListingState = { status: "idle" }

export function ItemForm({
  categories,
  facilities = [],
}: {
  categories: Array<{ id: string; slug: string; name: string; kind: string }>
  facilities?: Array<{ id: string; name: string }>
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createItem, idleState)
  const [photoPath, setPhotoPath] = useState("/demo/item-placeholder.svg")
  const [photoMessage, setPhotoMessage] = useState<string | null>(null)
  const [requiresDeposit, setRequiresDeposit] = useState(false)
  const [kind, setKind] = useState<"item" | "skill">("item")
  const [valueSource, setValueSource] = useState<"owner" | "suggested" | "category_default">("owner")
  const [suggestedPrice, setSuggestedPrice] = useState("")
  const [suggestion, setSuggestion] = useState<SuggestListingState>(idleSuggestion)
  const [meetingArrangement, setMeetingArrangement] = useState("arranged_by_message")
  const [guardianAcknowledgement, setGuardianAcknowledgement] = useState(false)
  const [draft, setDraft] = useState({ title: "", category: "", condition: "good", description: "", days: "3", deposit: "0" })
  const update = (key: keyof typeof draft, value: string) => setDraft((current) => ({ ...current, [key]: value }))

  const [uploading, setUploading] = useState(false)

  async function handlePhoto(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setPhotoMessage("Uploading image…")
    try {
      const blob = await prepareImageForUpload(file, { maxDimension: 1600, quality: 0.82 })
      const path = `items/${crypto.randomUUID()}.webp`
      const { error } = await getBrowserClient().storage.from("item-photos").upload(path, blob, { upsert: true })
      if (error) throw error
      const { data } = getBrowserClient().storage.from("item-photos").getPublicUrl(path)
      setPhotoPath(data.publicUrl)
      setPhotoMessage("Photo compressed and uploaded.")
      const reader = new FileReader()
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result ?? ""))
        reader.onerror = () => reject(new Error("photo_read_failed"))
        reader.readAsDataURL(blob)
      })
      const snapForm = new FormData()
      snapForm.set("imageDataUrl", imageDataUrl)
      snapForm.set("fileName", file.name)
      const result: SuggestListingState = await suggestListing(idleSuggestion, snapForm).catch(() => ({ status: "error" as const, message: "Photo uploaded. Suggestions are unavailable; fill in the listing details." }))
      setSuggestion(result)
      if (result.status === "success" && result.suggestion) {
        const nextCategory = result.suggestion.categorySlug
        setDraft((current) => ({
          ...current,
          title: result.suggestion?.title || current.title,
          category: categories.some((category) => category.slug === nextCategory)
            ? nextCategory
            : current.category,
          condition: result.suggestion?.condition ?? current.condition,
          description: result.suggestion?.description || current.description,
        }))
        if (result.suggestion.estimatedValueRm != null) {
          setSuggestedPrice(String(result.suggestion.estimatedValueRm))
          setValueSource("suggested")
        }
      }
    } catch {
      setPhotoMessage("Photo upload failed. Please try again. Your previous image is unchanged.")
    } finally {
      setUploading(false)
    }
  }

  const categoryName = categories.find((category) => category.slug === draft.category)?.name
  const visibleCategories = categories.filter((category) => category.kind === kind)
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
              <Input id="item-title" name="title" required placeholder="Folding ladder" value={draft.title} onChange={(event) => update("title", event.target.value)} />
              <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(state.fieldErrors?.categorySlug)}>
                <FieldLabel htmlFor="item-category">Category</FieldLabel>
                <NativeSelect id="item-category" name="categorySlug" className="w-full" required value={draft.category} onChange={(event) => update("category", event.target.value)}>
                  <NativeSelectOption value="">Choose a category</NativeSelectOption>
                  {visibleCategories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.slug}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {suggestion.status === "success" && suggestion.suggestion?.categorySlug ? (
                  <p className="text-xs font-bold text-ink">Category suggested · confirm before listing</p>
                ) : null}
                <FieldError>{state.fieldErrors?.categorySlug?.[0]}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="item-condition">Condition</FieldLabel>
                <NativeSelect id="item-condition" name="condition" value={draft.condition} className="w-full" onChange={(event) => update("condition", event.target.value)}>
                  <NativeSelectOption value="like_new">Like new</NativeSelectOption>
                  <NativeSelectOption value="good">Good</NativeSelectOption>
                  <NativeSelectOption value="fair">Fair</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="item-kind">Listing type</FieldLabel>
                <NativeSelect
                  id="item-kind"
                  name="kind"
                  value={kind}
                  className="w-full"
                  onChange={(event) => {
                    const nextKind = event.target.value === "skill" ? "skill" : "item"
                    setKind(nextKind)
                    const nextCategories = categories.filter((category) => category.kind === nextKind)
                    if (!nextCategories.some((category) => category.slug === draft.category)) {
                      update("category", "")
                    }
                  }}
                >
                  <NativeSelectOption value="item">Item</NativeSelectOption>
                  <NativeSelectOption value="skill">Skill</NativeSelectOption>
                </NativeSelect>
              </Field>
              {kind === "item" ? (
                <Field>
                  <FieldLabel htmlFor="item-value-source">Value source</FieldLabel>
                  <NativeSelect
                    id="item-value-source"
                    name="valueSource"
                    value={valueSource}
                    className="w-full"
                    onChange={(event) => setValueSource(event.target.value as typeof valueSource)}
                  >
                    <NativeSelectOption value="owner">I know this value</NativeSelectOption>
                    <NativeSelectOption value="suggested">Suggested value</NativeSelectOption>
                    <NativeSelectOption value="category_default">Category default</NativeSelectOption>
                  </NativeSelect>
                </Field>
              ) : null}
            </div>
            <Field>
              <FieldLabel htmlFor="item-description">Description</FieldLabel>
              <Textarea
                id="item-description"
                name="description"
                rows={4}
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="What's included, any quirks, how to use it safely"
              />
            </Field>
            {suggestion.message ? (
              <p className="rounded-lg bg-lilac-tint p-3 text-sm text-ink" aria-live="polite">{suggestion.message}</p>
            ) : null}
          </FieldGroup>
        </fieldset>

        {kind === "skill" ? (
          <fieldset className={sectionClass}>
            <legend className={legendClass}>Skill session</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="skill-duration">Duration</FieldLabel>
                <Input id="skill-duration" name="durationMinutes" type="number" min="15" max="480" step="15" defaultValue="60" required />
                <FieldDescription>Minutes for one session.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="meeting-arrangement">Meeting place</FieldLabel>
                <NativeSelect
                  id="meeting-arrangement"
                  name="meetingArrangement"
                  value={meetingArrangement}
                  className="w-full"
                  onChange={(event) => setMeetingArrangement(event.target.value)}
                >
                  <NativeSelectOption value="arranged_by_message">Arranged by message</NativeSelectOption>
                  <NativeSelectOption value="shared_facility">Shared township space</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
            {meetingArrangement === "shared_facility" ? (
              <Field>
                <FieldLabel htmlFor="meeting-facility">Shared space</FieldLabel>
                <NativeSelect id="meeting-facility" name="meetingFacilityId" className="w-full" required>
                  <NativeSelectOption value="">Choose a shared space</NativeSelectOption>
                  {facilities.map((facility) => (
                    <NativeSelectOption key={facility.id} value={facility.id}>{facility.name}</NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldDescription>Never use a home address in a listing.</FieldDescription>
              </Field>
            ) : null}
            {draft.category === "tuition" ? (
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink-muted bg-surface px-4 text-sm font-bold text-ink">
                <Checkbox
                  name="guardianAcknowledgement"
                  checked={guardianAcknowledgement}
                  onCheckedChange={(checked) => setGuardianAcknowledgement(checked === true)}
                />
                A guardian will be present for under-18 students
              </label>
            ) : null}
          </fieldset>
        ) : null}

        <fieldset className={sectionClass}>
          <legend className={legendClass}>Photo</legend>
          <Field>
            <FieldLabel htmlFor="item-photo">Add a clear photo</FieldLabel>
            <Input
              id="item-photo"
              type="file"
              disabled={uploading || pending}
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0]
                void handlePhoto(file)
              }}
            />
            <FieldDescription>
              Images are compressed before upload. Wait for confirmation before publishing.
            </FieldDescription>
            {photoMessage ? <p className="text-sm text-ink-muted" aria-live="polite">{photoMessage}</p> : null}
          </Field>
        </fieldset>

        <fieldset className={sectionClass}>
          <legend className={legendClass}>Lending terms</legend>
          {kind === "item" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink-muted bg-surface px-4 text-sm font-bold text-ink">
              <Checkbox
                name="requiresDeposit"
                checked={requiresDeposit}
                onCheckedChange={(checked) => setRequiresDeposit(checked === true)}
              />
              Require a deposit
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-ink-muted bg-surface px-4 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50" aria-disabled={!requiresDeposit}>
              <Checkbox name="allowDepositWaiver" disabled={!requiresDeposit} />
              Allow highly trusted borrowers to skip it
            </label>
          </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="max-loan-days">{kind === "item" ? "Maximum loan days" : "Scheduling window (days)"}</FieldLabel>
              <Input id="max-loan-days" name="maxLoanDays" type="number" min="1" max="30" defaultValue={kind === "item" ? "3" : "1"} required onChange={(event) => update("days", event.target.value)} />
            </Field>
            {kind === "item" ? (<>
            <Field>
              <FieldLabel htmlFor="deposit">Deposit (RM)</FieldLabel>
              <Input id="deposit" name="depositRm" type="number" min="0" step="0.01" defaultValue="0" disabled={!requiresDeposit} onChange={(event) => update("deposit", event.target.value)} />
              <FieldDescription>Recorded only. BorrowLah never handles money.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="estimated-price">New price (RM, optional)</FieldLabel>
              <Input id="estimated-price" name="estimatedNewPriceRm" type="number" min="0" step="0.01" placeholder="250" />
              <FieldDescription>Used for estimated impact only.</FieldDescription>
            </Field>
            </>) : null}
          </div>
          {kind === "item" ? (<Field>
            <FieldLabel htmlFor="minimum-trust">Minimum trust tier</FieldLabel>
            <NativeSelect id="minimum-trust" name="minTrustTier" defaultValue="" className="w-full">
              <NativeSelectOption value="">Any neighbour</NativeSelectOption>
              <NativeSelectOption value="building">Building or higher</NativeSelectOption>
              <NativeSelectOption value="trusted">Trusted or higher</NativeSelectOption>
              <NativeSelectOption value="highly_trusted">Highly trusted only</NativeSelectOption>
            </NativeSelect>
            <FieldDescription>Borrowers see this requirement before requesting the item.</FieldDescription>
          </Field>) : null}
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
              src={photoPath}
              alt=""
              className="border border-hairline bg-sun-tint"
              badge={
                <span className={`rounded-full px-2.5 py-1 text-sm font-bold text-ink ${kind === "item" && deposit > 0 ? "bg-surface" : "bg-mint-tint"}`}>
                  {kind === "skill" ? "Skill session" : deposit > 0 ? `RM ${deposit.toFixed(2)} deposit` : "Free"}
                </span>
              }
              sizes="22rem"
            />
            <p className="mt-2 font-display text-lg font-bold text-ink">{draft.title || "Your item title"}</p>
            <p className="text-sm text-ink-muted first-letter:uppercase">
              {draft.condition.replace("_", " ")} · {kind === "skill" ? "session" : `up to ${draft.days || "3"} days`}{categoryName ? ` · ${categoryName}` : ""}
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
        <Button type="submit" variant="cta" size="cta" className="w-full" disabled={pending || uploading}>
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
