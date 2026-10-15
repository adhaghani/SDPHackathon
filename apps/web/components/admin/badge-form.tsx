"use client"

import { useActionState, useState } from "react"
import { saveBadge } from "@/actions/admin"
import {
  BADGE_ACTIONS,
  badgeRequirements,
  type BadgeCriteria,
  type BadgeDefinition,
} from "@/lib/badges"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"
import { Spinner } from "@workspace/ui/components/spinner"
import { Textarea } from "@workspace/ui/components/textarea"

const idleState = { status: "idle" } as const
const defaults: Record<string, BadgeCriteria> = {
  count: { type: "count", threshold: 1, action_types: ["event_attendance"] },
  streak: { type: "streak", threshold: 3 },
  consecutive_recent: {
    type: "consecutive_recent",
    threshold: 10,
    action_type: "item_returned_on_time",
  },
  sustained: {
    type: "sustained",
    min_types: 3,
    min_active_weeks: 6,
    window_weeks: 12,
  },
  manual: { type: "manual" },
}
const ruleNames: Record<string, string> = {
  count: "Activity count",
  streak: "Monthly sharing streak",
  consecutive_recent: "Consecutive on-time returns",
  sustained: "Sustained participation",
  manual: "Township office selection",
}
const iconNames: Record<string, string> = {
  award: "Award",
  "hand-heart": "Helping hand",
  leaf: "Leaf",
  recycle: "Recycle",
  shield: "Shield",
  sparkles: "Sparkles",
  "users-round": "Community",
  "shield-check": "Return shield",
  "calendar-check": "Calendar check",
  "calendar-heart": "Calendar heart",
  "calendar-star": "Calendar star",
  star: "Star",
}

export function BadgeForm({ badges }: { badges: BadgeDefinition[] }) {
  const [slug, setSlug] = useState("")
  const selected = badges.find((badge) => badge.slug === slug)
  return (
    <div className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="badge-to-edit">Award to edit</FieldLabel>
          <NativeSelect
            id="badge-to-edit"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          >
            <NativeSelectOption value="">Create a new award</NativeSelectOption>
            {badges.map((badge) => (
              <NativeSelectOption key={badge.slug} value={badge.slug}>
                {badge.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </FieldGroup>
      <BadgeEditor key={slug} initial={selected} />
    </div>
  )
}

function BadgeEditor({ initial }: { initial?: BadgeDefinition }) {
  const [state, action, pending] = useActionState(saveBadge, idleState)
  const [changeRequirements, setChangeRequirements] = useState(!initial)
  const [criteria, setCriteria] = useState<BadgeCriteria>(
    initial?.criteria ?? defaults.count!
  )
  const actions = [
    ...new Set([
      ...Object.keys(BADGE_ACTIONS),
      ...(criteria.action_types ?? []),
    ]),
  ]
  const icons = {
    ...iconNames,
    ...(initial?.icon && !iconNames[initial.icon]
      ? { [initial.icon]: initial.icon }
      : {}),
  }
  const numberField = (
    key: "threshold" | "min_types" | "min_active_weeks" | "window_weeks",
    label: string,
    max: number
  ) => (
    <Field key={key}>
      <FieldLabel htmlFor={`badge-${key}`}>{label}</FieldLabel>
      <Input
        id={`badge-${key}`}
        type="number"
        min={1}
        max={max}
        step={1}
        required
        value={criteria[key] ?? 1}
        onChange={(event) =>
          setCriteria((current) => ({
            ...current,
            [key]: Number(event.target.value),
          }))
        }
      />
    </Field>
  )

  return (
    <form action={action} className="flex flex-col gap-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="badge-slug">Slug</FieldLabel>
          <Input
            id="badge-slug"
            name="slug"
            defaultValue={initial?.slug}
            placeholder="neighbour-helper"
            required
            readOnly={Boolean(initial)}
          />
          <FieldDescription>
            {initial
              ? "This identifies the existing award and stays the same when you edit it."
              : "Use lowercase letters, numbers and hyphens."}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="badge-name">Name</FieldLabel>
          <Input
            id="badge-name"
            name="name"
            defaultValue={initial?.name}
            required
            minLength={3}
            maxLength={80}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="badge-description">Description</FieldLabel>
          <Textarea
            id="badge-description"
            name="description"
            defaultValue={initial?.description}
            rows={3}
            required
            minLength={3}
            maxLength={240}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="badge-icon">Icon</FieldLabel>
          <NativeSelect
            id="badge-icon"
            name="icon"
            defaultValue={initial?.icon ?? "award"}
          >
            {Object.entries(icons).map(([icon, label]) => (
              <NativeSelectOption key={icon} value={icon}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </FieldGroup>
      {initial ? (
        <Field orientation="horizontal">
          <Checkbox
            id="badge-change-rule"
            checked={changeRequirements}
            onCheckedChange={(checked) => {
              setChangeRequirements(checked === true)
              if (!checked) setCriteria(initial.criteria)
            }}
          />
          <div>
            <FieldLabel htmlFor="badge-change-rule">
              Change earning requirements
            </FieldLabel>
            <FieldDescription>
              Leave this off to keep the existing rule. Badges already earned
              stay earned.
            </FieldDescription>
          </div>
        </Field>
      ) : null}
      {changeRequirements ? (
        <FieldSet>
          <FieldLegend>Earning requirements</FieldLegend>
          <input
            type="hidden"
            name="criteria"
            value={JSON.stringify(criteria)}
          />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="badge-rule-type">
                How residents earn this badge
              </FieldLabel>
              <NativeSelect
                id="badge-rule-type"
                value={criteria.type}
                onChange={(event) => setCriteria(defaults[event.target.value]!)}
              >
                {!ruleNames[criteria.type] ? (
                  <NativeSelectOption value={criteria.type}>
                    Existing rule
                  </NativeSelectOption>
                ) : null}
                {Object.entries(ruleNames).map(([type, label]) => (
                  <NativeSelectOption key={type} value={type}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            {["count", "streak", "consecutive_recent"].includes(criteria.type)
              ? numberField(
                  "threshold",
                  criteria.type === "streak"
                    ? "Consecutive months required"
                    : criteria.type === "consecutive_recent"
                      ? "Consecutive on-time returns required"
                      : "Qualifying activities required",
                  criteria.type === "streak" ? 120 : 10000
                )
              : null}
            {criteria.type === "count" ? (
              <>
                <FieldSet>
                  <FieldLegend>Activities that count</FieldLegend>
                  <FieldGroup>
                    {actions.map((actionType) => (
                      <Field key={actionType} orientation="horizontal">
                        <Checkbox
                          id={`badge-action-${actionType}`}
                          checked={
                            criteria.action_types?.includes(actionType) ?? false
                          }
                          onCheckedChange={(checked) =>
                            setCriteria((current) => ({
                              ...current,
                              action_types: checked
                                ? [...(current.action_types ?? []), actionType]
                                : (current.action_types ?? []).filter(
                                    (action) => action !== actionType
                                  ),
                            }))
                          }
                        />
                        <FieldLabel htmlFor={`badge-action-${actionType}`}>
                          {BADGE_ACTIONS[
                            actionType as keyof typeof BADGE_ACTIONS
                          ] ?? actionType.replaceAll("_", " ")}
                        </FieldLabel>
                      </Field>
                    ))}
                  </FieldGroup>
                </FieldSet>
                <Field orientation="horizontal">
                  <Checkbox
                    id="badge-sustainability"
                    checked={
                      criteria.metadata?.counts_as_sustainability === true
                    }
                    onCheckedChange={(checked) =>
                      setCriteria((current) => {
                        const metadata = { ...current.metadata }
                        if (checked) metadata.counts_as_sustainability = true
                        else delete metadata.counts_as_sustainability
                        return { ...current, metadata }
                      })
                    }
                  />
                  <FieldLabel htmlFor="badge-sustainability">
                    Only activities marked as sustainability count
                  </FieldLabel>
                </Field>
              </>
            ) : null}
            {criteria.type === "sustained" ? (
              <>
                {numberField(
                  "min_types",
                  "Different activity types required",
                  20
                )}
                {numberField("min_active_weeks", "Active weeks required", 104)}
                {numberField("window_weeks", "Time window in weeks", 104)}
              </>
            ) : null}
          </FieldGroup>
        </FieldSet>
      ) : null}
      <div className="rounded-lg bg-ground p-4">
        <p className="text-sm font-bold text-ink">Requirement preview</p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {badgeRequirements(criteria)}
        </p>
      </div>
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}Save award
      </Button>
    </form>
  )
}
