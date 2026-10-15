"use client"

import {
  Award,
  HandHeart,
  Leaf,
  Recycle,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react"

import {
  badgeRequirements,
  type BadgeCriteria,
  type BadgeProgress,
} from "@/lib/badges"
import { formatEventDate } from "@/lib/format"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

const icons = {
  award: Award,
  "hand-heart": HandHeart,
  leaf: Leaf,
  recycle: Recycle,
  shield: ShieldCheck,
  sparkles: Sparkles,
  "users-round": UsersRound,
} as const
const fills = ["bg-coral", "bg-mint", "bg-lilac", "bg-sun"] as const

export function BadgeCard({
  name,
  description,
  icon,
  earned,
  progress,
  criteria,
  earnedAt,
  earnedCriteria,
  catalogue = false,
  index = 0,
}: {
  name: string
  description: string
  icon: string
  earned: boolean
  progress?: BadgeProgress
  criteria?: BadgeCriteria | null
  earnedAt?: string | null
  earnedCriteria?: BadgeCriteria | null
  catalogue?: boolean
  index?: number
}) {
  const Icon = icons[icon as keyof typeof icons] ?? Award
  const progressText = progress?.requirements
    .map(
      (requirement) =>
        `${requirement.current} of ${requirement.target} ${requirement.label}`
    )
    .join(". ")
  return (
    <li className="min-w-0">
      <Dialog>
        <DialogTrigger
          aria-label={`${name} badge details`}
          className="block w-full cursor-pointer rounded-lg text-center outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <span
            className={cn(
              "relative grid aspect-square w-full place-items-center rounded-lg",
              earned
                ? "border border-hairline bg-surface"
                : "border-2 border-dashed border-ink-muted bg-ground"
            )}
          >
            {earned ? (
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-[45%] place-items-center rounded-full",
                  fills[index % fills.length]
                )}
              >
                <Icon className="size-1/2 text-ink" strokeWidth={2} />
              </span>
            ) : (
              <Icon
                aria-hidden="true"
                className="size-[35%] text-ink-muted"
                strokeWidth={1.4}
              />
            )}
          </span>
          <span
            className={cn(
              "mt-2 block text-sm leading-tight font-bold",
              earned ? "text-ink" : "text-ink-muted"
            )}
          >
            {name}
          </span>
          <span className="mt-1 block text-xs text-ink-muted">
            {catalogue
              ? "Award requirements"
              : earned
                ? "Earned"
                : "Not earned yet"}
          </span>
          <span className="mt-2 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-ink">
            Details
          </span>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-sm leading-6 text-ink">
            {earned ? (
              <>
                {earnedAt ? (
                  <p className="font-bold">
                    Earned{" "}
                    <time dateTime={earnedAt}>{formatEventDate(earnedAt)}</time>
                  </p>
                ) : null}
                <div>
                  <p className="font-bold">How you earned it</p>
                  <p>{badgeRequirements(earnedCriteria)}</p>
                </div>
              </>
            ) : null}
            <div>
              <p className="font-bold">
                {earned ? "Current requirements" : "How to earn it"}
              </p>
              <p>{badgeRequirements(criteria)}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {!earned && progress ? (
        <div className="mt-1 flex flex-col gap-2">
          {progress.percent !== null ? (
            <Progress
              value={progress.percent}
              aria-label={`${name} progress`}
              aria-valuetext={progressText}
            />
          ) : null}
          <p className="text-center text-xs leading-5 text-ink-muted">
            {progressText || progress.note}
          </p>
          {progress.eligible ? (
            <p className="text-center text-xs leading-5 text-ink-muted">
              Requirements met. Awaiting award verification.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
