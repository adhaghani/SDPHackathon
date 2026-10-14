import { GiftIcon, TargetIcon } from "lucide-react"

import { TurtleProgressIllustration } from "@/components/recycling/turtle-progress-illustration"
import type { RecyclingCampaign } from "@/components/recycling/types"
import { cn } from "@workspace/ui/lib/utils"

function formatKg(value: number) {
  return value.toLocaleString("en-MY", { maximumFractionDigits: 1 })
}

export function clampProgressPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

export function TurtleGoalCard({
  campaign,
  className,
}: {
  campaign: RecyclingCampaign
  className?: string
}) {
  const hasCampaign = campaign.hasCampaign
  const current = campaign.currentKg ?? 0
  const target = campaign.targetKg ?? 0
  const percent = clampProgressPercent(campaign.percent ?? 0)
  const completed = Boolean(campaign.completed)
  const reward = campaign.rewardBp
  const ariaLabel = hasCampaign
    ? `${campaign.title ?? "Township recycling goal"}: ${formatKg(current)} of ${formatKg(target)} kilograms`
    : "No active township recycling goal"

  return (
    <section
      aria-label={ariaLabel}
      className={cn("rounded-[22px] bg-sky p-5 text-ink", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] leading-4 font-bold tracking-[0.06em] uppercase">
            {hasCampaign ? "Township goal · estimated kg" : "Township goal"}
          </p>
          <h2 className="mt-1 font-display text-[24px] leading-7 font-extrabold text-balance">
            {hasCampaign ? campaign.title : "No active recycling goal"}
          </h2>
        </div>
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-white"
        >
          <TargetIcon className="size-5" strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="min-w-0">
          {hasCampaign ? (
            <>
              <p
                role={hasCampaign ? "progressbar" : undefined}
                aria-valuemin={hasCampaign ? 0 : undefined}
                aria-valuemax={hasCampaign ? 100 : undefined}
                aria-valuenow={hasCampaign ? Math.round(percent) : undefined}
                aria-valuetext={
                  hasCampaign
                    ? `${Math.round(percent)} percent, ${formatKg(current)} of ${formatKg(target)} kilograms`
                    : undefined
                }
                aria-label="Township recycling progress"
                className="font-display text-4xl leading-10 font-extrabold tabular-nums"
              >
                {Math.round(percent)}%
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {formatKg(current)} of {formatKg(target)} kg
              </p>
              <p className="mt-2 text-sm">
                Self-reported estimates; no staff-measured collection weight is
                recorded. Photos do not verify weight.
              </p>
              <p className="mt-3 text-sm">
                {completed
                  ? "Estimated goal reached. Thank you for contributing your logs."
                  : `${campaign.daysRemaining ?? 0} days left to reach the target.`}
              </p>
              {!completed && campaign.isContributor && reward ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold">
                  <GiftIcon aria-hidden="true" className="size-3.5" />+{reward}{" "}
                  BP when the goal is reached
                </p>
              ) : null}
              {!completed && !campaign.isContributor ? (
                <p className="mt-2 text-xs text-ink-soft">
                  Add an estimate to become eligible for the contributor reward.
                </p>
              ) : null}
              {completed && reward ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold">
                  <GiftIcon aria-hidden="true" className="size-3.5" />
                  Contributors received +{reward} BP
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm">
              The township office has not set a collective recycling target yet.
              Your personal estimates still count on your impact page.
            </p>
          )}
        </div>

        <TurtleProgressIllustration
          percent={percent}
          hasCampaign={hasCampaign}
        />
      </div>
    </section>
  )
}
