"use client"

import { useActionState, useEffect, useState } from "react"
import {
  BatteryWarningIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  DropletsIcon,
  PackageOpenIcon,
  RecycleIcon,
  TagsIcon,
} from "lucide-react"

import {
  completeRecyclingGuideAction,
  type RecyclingGuideActionState,
} from "@/actions/recycling"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Progress } from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"

const steps = [
  {
    title: "Check the bin label",
    description:
      "Use the material name shown on the township bin. Bin colours and accepted items can differ between collection points.",
    icon: TagsIcon,
    items: ["Paper and cardboard", "Plastic", "Glass", "Aluminium and steel"],
  },
  {
    title: "Empty, rinse and dry",
    description:
      "Remove food and liquid before recycling. A quick rinse helps prevent smells and keeps clean materials from being contaminated.",
    icon: DropletsIcon,
    items: [
      "Empty every container",
      "Give it a quick rinse",
      "Let it drain before placing it in the bin",
    ],
  },
  {
    title: "Prepare items properly",
    description:
      "Flatten cardboard boxes to save space. Keep recyclable parts together unless the bin instructions ask you to separate them.",
    icon: PackageOpenIcon,
    items: [
      "Flatten boxes",
      "Remove leftover food",
      "Place items gently—do not force an overflowing bin",
    ],
  },
  {
    title: "Keep problem items separate",
    description:
      "Some items need a dedicated collection point and should not go into ordinary recycling bins.",
    icon: BatteryWarningIcon,
    items: [
      "Batteries and electronics",
      "Light bulbs, ceramics and mirrors",
      "Tissues, nappies and food waste",
    ],
  },
  {
    title: "You are ready to recycle",
    description:
      "Sort by the label, keep materials clean, and use a dedicated collection point for special waste. When unsure, leave the item out and check with the township office.",
    icon: RecycleIcon,
    items: ["Check", "Clean", "Sort", "Recycle"],
  },
] as const

const idleState: RecyclingGuideActionState = { status: "idle" }

export function RecyclingGuideDialog({
  completed,
  rewardPoints,
}: {
  completed: boolean
  rewardPoints: number
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [state, action, pending] = useActionState(
    completeRecyclingGuideAction,
    idleState
  )
  const isCompleted = completed || state.status === "success"
  const current = steps[step] ?? steps[0]
  const Icon = current.icon

  useEffect(() => {
    if (!open) setStep(0)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger
        render={<Button type="button" variant="outline" className="shrink-0" />}
      >
        {isCompleted ? (
          <CheckCircle2Icon aria-hidden="true" className="size-4" />
        ) : (
          <CircleHelpIcon aria-hidden="true" className="size-4" />
        )}
        {isCompleted
          ? "Recycling guide completed"
          : `Recycling guide · +${rewardPoints} BP`}
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="px-5 pt-5 pr-12 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-eyebrow text-ink-muted">
              Rimba · Recycling basics
            </p>
            <span className="text-xs font-semibold text-ink-muted tabular-nums">
              {step + 1} of {steps.length}
            </span>
          </div>
          <Progress
            value={((step + 1) / steps.length) * 100}
            aria-label={`Guide progress: step ${step + 1} of ${steps.length}`}
          />
          <DialogTitle className="pt-2">{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <div className="px-5 sm:px-6">
          <div className="rounded-[24px] bg-mint-tint p-5 sm:p-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-ink text-lime">
              <Icon aria-hidden="true" className="size-6" />
            </div>
            <ul className="mt-5 grid gap-3" aria-label="Key recycling guidance">
              {current.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm font-semibold text-ink"
                >
                  <CheckCircle2Icon
                    aria-hidden="true"
                    className="text-forest mt-0.5 size-4 shrink-0"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {step === steps.length - 1 && !isCompleted ? (
            <p className="mt-4 text-sm text-ink-soft">
              Finish this guide once to earn {rewardPoints} BetterPoints.
            </p>
          ) : null}

          {step === steps.length - 1 && isCompleted ? (
            <Alert className="mt-4">
              <CheckCircle2Icon aria-hidden="true" />
              <AlertDescription>
                {state.message ?? `Guide completed · ${rewardPoints} BP earned`}
              </AlertDescription>
            </Alert>
          ) : null}

          {state.status === "error" ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0 || pending}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            <ChevronLeftIcon aria-hidden="true" />
            Back
          </Button>

          {step < steps.length - 1 ? (
            <Button
              type="button"
              variant="cta"
              onClick={() =>
                setStep((value) => Math.min(steps.length - 1, value + 1))
              }
            >
              Next
              <ChevronRightIcon aria-hidden="true" />
            </Button>
          ) : isCompleted ? (
            <Button type="button" variant="cta" onClick={() => setOpen(false)}>
              Done
            </Button>
          ) : (
            <form action={action}>
              <Button type="submit" variant="cta" disabled={pending}>
                {pending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <CheckCircle2Icon aria-hidden="true" />
                )}
                Finish and earn {rewardPoints} BP
              </Button>
            </form>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
