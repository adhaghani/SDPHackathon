"use client"

import { useActionState, useState } from "react"

import {
  saveRecyclingCampaignAction,
  saveRecyclingFactorAction,
  type RecyclingAdminActionState,
} from "@/actions/recycling"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { NativeSelect, NativeSelectOption } from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export type ExistingRecyclingCampaign = {
  id: string
  title: string
  startsOn: string
  endsOn: string
  targetKg: number
  status: "active" | "completed" | "ended" | "cancelled"
}

export type RecyclingMaterialFactor = {
  slug: string
  name: string
  co2eKgPerKg: number | null
  energyKwhPerKg: number | null
  factorSource: string | null
}

export function RecyclingCampaignForm({
  townshipId,
  campaign,
  defaults,
}: {
  townshipId: string
  campaign?: ExistingRecyclingCampaign
  defaults: { startsOn: string; endsOn: string }
}) {
  const [state, action, pending] = useActionState<RecyclingAdminActionState, FormData>(
    saveRecyclingCampaignAction,
    idleState
  )
  const locked = campaign?.status === "completed" || campaign?.status === "ended"

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <input type="hidden" name="townshipId" value={townshipId} />
      {campaign ? <input type="hidden" name="campaignId" value={campaign.id} /> : null}
      <input type="hidden" name="status" value={campaign?.status === "cancelled" ? "cancelled" : "active"} />
      <Field>
        <FieldLabel htmlFor="recycling-campaign-title">Campaign title</FieldLabel>
        <Input
          id="recycling-campaign-title"
          name="title"
          defaultValue={campaign?.title ?? "October recycling goal"}
          minLength={3}
          maxLength={120}
          disabled={locked}
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="recycling-start">Start date</FieldLabel>
          <Input
            id="recycling-start"
            name="startsOn"
            type="date"
            defaultValue={campaign?.startsOn ?? defaults.startsOn}
            disabled={locked}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="recycling-end">End date</FieldLabel>
          <Input
            id="recycling-end"
            name="endsOn"
            type="date"
            defaultValue={campaign?.endsOn ?? defaults.endsOn}
            disabled={locked}
            required
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="recycling-target">Collective target in estimated kg</FieldLabel>
        <Input
          id="recycling-target"
          name="targetKg"
          type="number"
          min="0.001"
          step="0.001"
          defaultValue={campaign?.targetKg ?? ""}
          disabled={locked}
          required
        />
      </Field>
      {locked ? (
        <p className="rounded-lg bg-mint-tint p-3 text-sm text-ink">
          This campaign is finished. Start another campaign after its end date.
        </p>
      ) : null}
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending || locked} className="w-fit">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save recycling campaign
      </Button>
    </form>
  )
}

export function RecyclingFactorForm({
  townshipId,
  materials,
}: {
  townshipId: string
  materials: RecyclingMaterialFactor[]
}) {
  const [state, action, pending] = useActionState<RecyclingAdminActionState, FormData>(
    saveRecyclingFactorAction,
    idleState
  )
  const [selectedSlug, setSelectedSlug] = useState(materials[0]?.slug ?? "")
  const selected = materials.find((material) => material.slug === selectedSlug) ?? materials[0]

  return (
    <form action={action} className="mt-4 flex flex-col gap-4">
      <input type="hidden" name="townshipId" value={townshipId} />
      <Field>
        <FieldLabel htmlFor="recycling-factor-material">Material</FieldLabel>
        <NativeSelect
          id="recycling-factor-material"
          name="slug"
          value={selectedSlug}
          onChange={(event) => setSelectedSlug(event.target.value)}
          className="w-full"
          required
        >
          {materials.map((material) => (
            <NativeSelectOption key={material.slug} value={material.slug}>
              {material.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="recycling-co2e-factor">kg CO₂e avoided per kg</FieldLabel>
          <Input
            key={`co2e-${selectedSlug}`}
            id="recycling-co2e-factor"
            name="co2eKgPerKg"
            type="number"
            min="0"
            step="0.000001"
            defaultValue={selected?.co2eKgPerKg ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="recycling-energy-factor">kWh saved per kg</FieldLabel>
          <Input
            key={`energy-${selectedSlug}`}
            id="recycling-energy-factor"
            name="energyKwhPerKg"
            type="number"
            min="0"
            step="0.000001"
            defaultValue={selected?.energyKwhPerKg ?? ""}
            required
          />
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor="recycling-factor-source">Cited source</FieldLabel>
        <Input
          key={`source-${selectedSlug}`}
          id="recycling-factor-source"
          name="source"
          defaultValue={selected?.factorSource ?? ""}
          minLength={3}
          maxLength={500}
          required
        />
      </Field>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending} className="w-fit">
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Save material factors
      </Button>
    </form>
  )
}
