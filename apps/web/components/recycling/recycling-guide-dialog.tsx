"use client"

import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import {
  ArrowUpRightIcon,
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
    title: "Start with the bin label",
    description: "Check what your collection point accepts before you sort.",
    icon: TagsIcon,
    items: [
      {
        title: "Match the material",
        detail: "Look for paper, plastic, glass or metal on the label.",
      },
      {
        title: "Follow the local instructions",
        detail: "Bin colours and accepted items can vary by location.",
      },
      {
        title: "Unsure where it goes?",
        detail: "Keep it out and check with the township office.",
      },
    ],
    reminder: "The label on the bin is your first reference.",
  },
  {
    title: "Empty, rinse, then drain",
    description: "A little preparation keeps the rest of the recycling clean.",
    icon: DropletsIcon,
    items: [
      {
        title: "Empty the container",
        detail: "Remove leftover drinks and food first.",
      },
      {
        title: "Give it a quick rinse",
        detail: "Clear away residue that could soil other materials.",
      },
      {
        title: "Let the water drain",
        detail: "Keep liquids out of the recycling bin.",
      },
    ],
    reminder: "Food and liquid can contaminate clean recyclables.",
  },
  {
    title: "Make room for everyone",
    description:
      "Prepare your items before taking them to the collection point.",
    icon: PackageOpenIcon,
    items: [
      {
        title: "Flatten cardboard boxes",
        detail: "They take up less space in the shared bin.",
      },
      {
        title: "Check before separating parts",
        detail: "Follow the bin instructions for recyclable parts.",
      },
      {
        title: "Leave overflowing bins alone",
        detail: "Do not force items in. Check with the township office.",
      },
    ],
    reminder: "Place items gently and keep the collection area usable.",
  },
  {
    title: "Keep these out of the bin",
    description: "These items do not belong in ordinary recycling bins.",
    icon: BatteryWarningIcon,
    items: [
      {
        title: "Batteries and electronics",
        detail: "Use a dedicated collection point.",
      },
      {
        title: "Light bulbs, ceramics and mirrors",
        detail: "Keep separate and check local disposal instructions.",
      },
      {
        title: "Tissues, nappies and food waste",
        detail: "Keep them out of your recyclable materials.",
      },
    ],
    reminder: "Ask the township office where to take special waste.",
  },
  {
    title: "Ready for your next trip",
    description: "Use this quick checklist whenever you recycle.",
    icon: RecycleIcon,
    items: [
      {
        title: "Accepted by this collection point?",
        detail: "Match your materials to the bin label.",
      },
      {
        title: "Empty and clean?",
        detail: "Remove food and liquid; flatten cardboard boxes.",
      },
      {
        title: "Special waste kept separate?",
        detail: "Check where it belongs before dropping it off.",
      },
    ],
    reminder: "After recycling, log an estimate to track your contribution.",
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
  const isLastStep = step === steps.length - 1
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
          <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
        ) : (
          <CircleHelpIcon aria-hidden="true" data-icon="inline-start" />
        )}
        {isCompleted
          ? "Revisit recycling guide"
          : `Recycling guide · +${rewardPoints} BP`}
      </DialogTrigger>

      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 gap-3 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pr-14">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
              <RecycleIcon aria-hidden="true" className="size-5" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>Recycling made simple</DialogTitle>
              <DialogDescription>
                Five small steps for your next recycling trip.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="shrink-0 px-5 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span aria-live="polite" aria-atomic="true">
              Step {step + 1} of {steps.length}
              <span className="sr-only">: {current.title}</span>
            </span>
            <span>
              {isCompleted
                ? "Completed · revisit anytime"
                : `Complete once · +${rewardPoints} BP`}
            </span>
          </div>
          <Progress
            value={((step + 1) / steps.length) * 100}
            aria-label={`Guide progress: step ${step + 1} of ${steps.length}`}
          />
        </div>

        {/* Only the reading area scrolls when viewport height or text zoom requires it. */}
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
          <section aria-labelledby="recycling-guide-step-title">
            <div className="flex items-start gap-2.5">
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              />
              <div>
                <h3
                  id="recycling-guide-step-title"
                  className="font-display text-xl leading-tight font-bold text-balance"
                >
                  {current.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {current.description}
                </p>
              </div>
            </div>

            <ul className="mt-4 grid gap-3" aria-label="Key recycling guidance">
              {current.items.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  {step === 3 ? (
                    <BatteryWarningIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                  ) : (
                    <CheckCircle2Icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                  <div className="min-w-0 text-sm leading-snug">
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm leading-snug text-muted-foreground">
              {current.reminder}
            </p>
          </section>

          {isLastStep && isCompleted ? (
            <Alert role="status" className="mt-4">
              <CheckCircle2Icon aria-hidden="true" />
              <AlertDescription>
                {state.message ??
                  "You have completed this guide. You can revisit it anytime."}
              </AlertDescription>
            </Alert>
          ) : null}

          {state.status === "error" ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        {/* Reset the shared footer's negative margins because this dialog has no outer padding. */}
        <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-center justify-between gap-2 px-5 py-3 sm:justify-between sm:px-6">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0 || pending}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            <ChevronLeftIcon aria-hidden="true" data-icon="inline-start" />
            Back
          </Button>

          {!isLastStep ? (
            <Button
              type="button"
              variant="cta"
              onClick={() =>
                setStep((value) => Math.min(steps.length - 1, value + 1))
              }
            >
              Next
              <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
            </Button>
          ) : isCompleted ? (
            <Button variant="cta" render={<Link href="/recycling" />}>
              Log recycling
              <ArrowUpRightIcon aria-hidden="true" data-icon="inline-end" />
            </Button>
          ) : (
            <form action={action}>
              <Button type="submit" variant="cta" disabled={pending}>
                {pending ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <CheckCircle2Icon
                    aria-hidden="true"
                    data-icon="inline-start"
                  />
                )}
                {pending ? "Saving…" : `Finish · +${rewardPoints} BP`}
              </Button>
            </form>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
