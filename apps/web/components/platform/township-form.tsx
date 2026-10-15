"use client"

import { useActionState, useEffect, useId, useMemo, useState } from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
} from "lucide-react"
import { saveTownship, checkBoundary } from "@/actions/platform"
import { boundarySchema, type Boundary } from "@/lib/validation/township"
import type { PlatformTownship } from "@/lib/platform"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@workspace/ui/components/alert-dialog"
import { LazyBoundaryMap } from "./lazy-boundary-map"

const steps = ["Details", "Boundary", "Neighbourhoods", "Manager", "Review"]

export function TownshipForm({
  township,
  townships,
}: {
  township?: PlatformTownship
  townships: PlatformTownship[]
}) {
  const formId = useId()
  const [result, action, pending] = useActionState(saveTownship, {
    status: "idle",
  })
  const [step, setStep] = useState(0)
  const [stepError, setStepError] = useState("")
  const [boundary, setBoundary] = useState<Boundary | null>(
    () => boundarySchema.safeParse(township?.boundary).data ?? null
  )
  const initialBoundary = useMemo(
    () => boundarySchema.safeParse(township?.boundary).data ?? null,
    [township?.boundary]
  )
  const [boundaryCheck, setBoundaryCheck] = useState<{
    names: string[]
    error?: string
    checking?: boolean
  }>({ names: [] })
  const [acknowledge, setAcknowledge] = useState(false)
  const [mapVersion, setMapVersion] = useState(0)
  const [data, setData] = useState({
    name: township?.name ?? "",
    slug: township?.slug ?? "",
    join_code: township?.join_code ?? "",
    state: township?.state ?? "",
    district: township?.district ?? "",
    description: township?.description ?? "",
    neighbourhoods:
      township?.neighbourhoods.map((n) => n.name).join("\n") ?? "",
    auto_approve_members: township?.auto_approve_members ?? false,
    require_event_approval: township?.require_event_approval ?? true,
    lifecycle: township?.lifecycle ?? "draft",
    managerName: "",
    managerEmail: "",
  })
  const mapped = useMemo(
    () =>
      townships.map((t) => ({
        ...t,
        boundary: boundarySchema.safeParse(t.boundary).data ?? null,
      })),
    [townships]
  )
  useEffect(() => {
    if (!boundary) return
    let cancelled = false
    const timer = setTimeout(() => {
      setBoundaryCheck({ names: [], checking: true })
      checkBoundary(boundary, township?.id)
        .then((value) => {
          if (!cancelled) setBoundaryCheck(value)
        })
        .catch(() => {
          if (!cancelled)
            setBoundaryCheck({
              names: [],
              error: "Boundary check failed. Try again before saving.",
            })
        })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [boundary, township?.id])
  function changeBoundary(value: Boundary | null) {
    setBoundary(value)
    setAcknowledge(false)
    setBoundaryCheck({ names: [], checking: Boolean(value) })
  }
  function next() {
    const message =
      step === 0 &&
      (!data.name.trim() ||
        !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.slug) ||
        !/^[A-Z0-9-]{6,40}$/.test(data.join_code) ||
        !data.state.trim() ||
        !data.district.trim())
        ? "Enter the township name, state, district, a valid slug and a join code of at least six characters."
        : step === 1 &&
            (!boundary ||
              boundaryCheck.error ||
              boundaryCheck.checking ||
              (boundaryCheck.names.length > 0 && !acknowledge))
          ? "Finish the boundary check and acknowledge any overlaps before continuing."
          : step === 2 && !data.neighbourhoods.trim()
            ? "Add at least one neighbourhood."
            : step === 3 &&
                !township &&
                (data.managerName.trim().length < 2 ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.managerEmail))
              ? "Enter the first manager’s name and email address."
              : ""
    setStepError(message)
    if (!message) {
      setStep((n) => (township && n === 2 ? 4 : n + 1))
      document.getElementById(`${formId}-step`)?.focus()
    }
  }
  const field = (
    key:
      | "name"
      | "slug"
      | "join_code"
      | "state"
      | "district"
      | "managerName"
      | "managerEmail",
    label: string,
    hint?: string
  ) => (
    <Field>
      <FieldLabel htmlFor={`${formId}-${key}`}>{label}</FieldLabel>
      <Input
        id={`${formId}-${key}`}
        value={data[key]}
        type={key === "managerEmail" ? "email" : "text"}
        maxLength={key === "managerEmail" ? 254 : 120}
        onChange={(e) => {
          const value =
            key === "join_code" ? e.target.value.toUpperCase() : e.target.value
          setData((old) => ({
            ...old,
            [key]: value,
            ...(key === "name" &&
            !township &&
            (!old.slug ||
              old.slug ===
                old.name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""))
              ? {
                  slug: value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, ""),
                }
              : {}),
          }))
        }}
      />
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
    </Field>
  )
  const check = (
    key: "auto_approve_members" | "require_event_approval",
    label: string
  ) => (
    <div className="flex items-start gap-3">
      <Checkbox
        id={`${formId}-${key}`}
        checked={data[key]}
        onCheckedChange={(value) =>
          setData((old) => ({ ...old, [key]: value === true }))
        }
      />
      <label htmlFor={`${formId}-${key}`} className="text-sm leading-6">
        {label}
      </label>
    </div>
  )
  return (
    <form
      id={formId}
      action={action}
      className="flex flex-col gap-7"
      onSubmit={(event) => {
        if (step !== 4) {
          event.preventDefault()
          next()
        }
      }}
    >
      {township ? <input type="hidden" name="id" value={township.id} /> : null}
      {Object.entries(data)
        .filter(([, value]) => typeof value === "string")
        .map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ))}
      <input type="hidden" name="boundary" value={JSON.stringify(boundary)} />
      {data.auto_approve_members ? (
        <input type="hidden" name="auto_approve_members" value="on" />
      ) : null}
      {data.require_event_approval ? (
        <input type="hidden" name="require_event_approval" value="on" />
      ) : null}
      {acknowledge ? (
        <input type="hidden" name="acknowledge_overlaps" value="on" />
      ) : null}
      <ol
        aria-label="Township setup progress"
        className="flex flex-wrap gap-x-5 gap-y-3 border-b border-hairline pb-5"
      >
        {steps.map((label, index) =>
          township && index === 3 ? null : (
            <li key={label}>
              <button
                type="button"
                disabled={index > step}
                onClick={() => {
                  setStep(index)
                  setStepError("")
                }}
                aria-current={step === index ? "step" : undefined}
                className={`flex min-h-11 items-center gap-2 text-sm ${step === index ? "font-bold text-ink underline underline-offset-8" : "text-ink-muted"}`}
              >
                <span className="flex size-6 items-center justify-center rounded-full border border-hairline text-xs">
                  {index < step ? (
                    <CheckIcon aria-hidden="true" className="size-3" />
                  ) : township && index === 4 ? (
                    4
                  ) : (
                    index + 1
                  )}
                </span>
                {label}
              </button>
            </li>
          )
        )}
      </ol>
      <div>
        <h2
          id={`${formId}-step`}
          tabIndex={-1}
          className="font-display text-2xl font-bold outline-none"
        >
          {
            [
              "Give your township a home",
              "Draw the township boundary",
              "Set up the community",
              "Appoint the first manager",
              "Review your township",
            ][step]
          }
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          {
            [
              "Use a clear name and a unique code that residents can enter when joining.",
              "Search for a place, choose Draw polygon, then click around its edge. Click the first point to close it. Edit lets you drag points; save the edit using the map controls.",
              "Add one neighbourhood per line. Existing neighbourhoods and their memberships are preserved when editing.",
              "An existing verified account receives manager access. A new manager receives an email link to set their password and accept.",
              township
                ? "Check these details before saving your changes."
                : "The township starts as a draft. After the manager appointment is ready, you can activate it from its detail page.",
            ][step]
          }
        </p>
      </div>
      <div hidden={step !== 0} className="grid max-w-3xl gap-5 sm:grid-cols-2">
        {field("name", "Township name")}
        {field("slug", "URL slug", "Lowercase letters, numbers and hyphens.")}
        {field("state", "State / federal territory")}
        {field("district", "District")}
        {field(
          "join_code",
          "Resident join code",
          "6–40 uppercase letters, numbers or hyphens."
        )}
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={`${formId}-description`}>
            Description (optional)
          </FieldLabel>
          <Textarea
            id={`${formId}-description`}
            maxLength={2000}
            value={data.description}
            onChange={(e) =>
              setData((old) => ({ ...old, description: e.target.value }))
            }
          />
        </Field>
      </div>
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <LazyBoundaryMap
            key={mapVersion}
            initialBoundary={boundary ?? initialBoundary}
            currentId={township?.id}
            townships={mapped}
            onChange={changeBoundary}
          />
          <div aria-live="polite" className="text-sm">
            {!boundary ? (
              <p>
                Draw a boundary to continue. You can also enter GeoJSON below.
              </p>
            ) : boundaryCheck.checking ? (
              <p>Checking boundary and neighbouring townships…</p>
            ) : boundaryCheck.error ? (
              <p role="alert" className="text-destructive">
                {boundaryCheck.error}
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <MapPinIcon aria-hidden="true" className="size-4" />
                Boundary ready ·{" "}
                {Math.max(0, (boundary.coordinates[0]?.length ?? 1) - 1)} points
              </p>
            )}
            {boundaryCheck.names.length > 0 ? (
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-hairline bg-sun-tint p-4">
                <p>
                  This area overlaps: {boundaryCheck.names.join(", ")}. Check
                  the shared boundaries before continuing.
                </p>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`${formId}-overlap`}
                    checked={acknowledge}
                    onCheckedChange={(value) => setAcknowledge(value === true)}
                  />
                  <label htmlFor={`${formId}-overlap`}>
                    I reviewed and accept this overlap.
                  </label>
                </div>
              </div>
            ) : null}
          </div>
          <details className="rounded-xl border border-hairline p-4">
            <summary className="cursor-pointer text-sm font-bold">
              Enter boundary coordinates instead
            </summary>
            <CoordinateInput
              onApply={(value) => {
                changeBoundary(value)
                setMapVersion((n) => n + 1)
              }}
            />
          </details>
        </div>
      ) : null}
      <div hidden={step !== 2} className="flex max-w-3xl flex-col gap-5">
        <Field>
          <FieldLabel htmlFor={`${formId}-neighbourhoods`}>
            Neighbourhood names
          </FieldLabel>
          <Textarea
            id={`${formId}-neighbourhoods`}
            rows={6}
            value={data.neighbourhoods}
            onChange={(e) =>
              setData((old) => ({ ...old, neighbourhoods: e.target.value }))
            }
            placeholder={"Precinct A\nPrecinct B"}
          />
        </Field>
        {check(
          "auto_approve_members",
          "Automatically approve residents who enter the join code"
        )}
        {check(
          "require_event_approval",
          "Require township approval before events are published"
        )}
      </div>
      {!township ? (
        <div
          hidden={step !== 3}
          className="grid max-w-3xl gap-5 sm:grid-cols-2"
        >
          {field("managerName", "Manager’s full name")}
          {field("managerEmail", "Manager’s email address")}
        </div>
      ) : null}
      {step === 4 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 text-sm">
              <dt className="text-ink-muted">Name</dt>
              <dd className="font-bold break-words">{data.name}</dd>
              <dt className="text-ink-muted">Location</dt>
              <dd>
                {data.district}, {data.state}
              </dd>
              <dt className="text-ink-muted">Join code</dt>
              <dd className="font-bold">{data.join_code}</dd>
              <dt className="text-ink-muted">Neighbourhoods</dt>
              <dd className="whitespace-pre-line">{data.neighbourhoods}</dd>
              <dt className="text-ink-muted">Membership</dt>
              <dd>
                {data.auto_approve_members
                  ? "Automatic approval"
                  : "Manager approval required"}
              </dd>
              {!township ? (
                <>
                  <dt className="text-ink-muted">First manager</dt>
                  <dd className="break-words">
                    {data.managerName}
                    <br />
                    {data.managerEmail}
                  </dd>
                </>
              ) : null}
            </dl>
            {township ? (
              <Field>
                <FieldLabel htmlFor={`${formId}-lifecycle`}>
                  Township status
                </FieldLabel>
                <NativeSelect
                  id={`${formId}-lifecycle`}
                  value={data.lifecycle}
                  onChange={(e) =>
                    setData((old) => ({ ...old, lifecycle: e.target.value }))
                  }
                >
                  <NativeSelectOption value="draft">Draft</NativeSelectOption>
                  <NativeSelectOption value="active">Active</NativeSelectOption>
                  <NativeSelectOption value="archived">
                    Archived
                  </NativeSelectOption>
                </NativeSelect>
                <p className="text-sm text-ink-muted">
                  Draft and archived townships cannot receive new residents.
                  Archiving keeps historical records.
                </p>
              </Field>
            ) : (
              <p className="rounded-xl bg-lime p-4 text-sm">
                Create as draft, check the manager appointment, then activate
                when ready.
              </p>
            )}
          </div>
          <LazyBoundaryMap initialBoundary={boundary} />
        </div>
      ) : null}
      {stepError || result.message ? (
        <p
          role="alert"
          className="rounded-xl border border-hairline p-4 text-sm"
        >
          {stepError || result.message}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-between gap-3 border-t border-hairline pt-5">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || pending}
          onClick={() => {
            setStep((n) => (township && n === 4 ? 2 : n - 1))
            setStepError("")
          }}
        >
          <ArrowLeftIcon aria-hidden="true" />
          Back
        </Button>
        {step < 4 ? (
          <Button
            type="button"
            variant="cta"
            onClick={(event) => {
              event.preventDefault()
              next()
            }}
          >
            Continue
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        ) : data.lifecycle === "archived" &&
          township?.lifecycle !== "archived" ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button type="button" variant="destructive" disabled={pending}>
                  Archive township
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive {data.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Residents and managers will lose access to this township. Its
                  records will be preserved. You can restore it here later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  form={formId}
                  disabled={pending}
                >
                  Archive township
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            type="submit"
            variant="cta"
            disabled={pending || !boundary || Boolean(boundaryCheck.error)}
          >
            {pending
              ? "Saving…"
              : township
                ? "Save township"
                : "Create township and appoint manager"}
          </Button>
        )}
      </div>
    </form>
  )
}

function CoordinateInput({ onApply }: { onApply: (value: Boundary) => void }) {
  const id = useId()
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  return (
    <div className="mt-4 flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor={id}>GeoJSON Polygon</FieldLabel>
        <Textarea
          id={id}
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            '{"type":"Polygon","coordinates":[[[101.60,3.10],[101.62,3.10],[101.62,3.12],[101.60,3.10]]]}'
          }
        />
      </Field>
      <p className="text-sm text-ink-muted">
        Coordinates use longitude, latitude. Close the ring by repeating the
        first point. Up to 500 boundary points; holes are not supported.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          try {
            const parsed = boundarySchema.safeParse(JSON.parse(text))
            if (!parsed.success) throw new Error()
            onApply(parsed.data)
            setError("")
          } catch {
            setError("Enter a valid, closed GeoJSON Polygon.")
          }
        }}
      >
        Use these coordinates
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
