import { GiftIcon, TargetIcon } from "lucide-react"

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
  const translateY = ((100 - percent) / 100) * 112
  const reward = campaign.rewardBp
  const ariaLabel = hasCampaign
    ? `${campaign.title ?? "Township recycling goal"}: ${formatKg(current)} of ${formatKg(target)} kilograms`
    : "No active township recycling goal"

  return (
    <section
      aria-label={ariaLabel}
      role={hasCampaign ? "progressbar" : undefined}
      aria-valuemin={hasCampaign ? 0 : undefined}
      aria-valuemax={hasCampaign ? 100 : undefined}
      aria-valuenow={hasCampaign ? Math.round(percent) : undefined}
      aria-valuetext={hasCampaign ? `${Math.round(percent)} percent, ${formatKg(current)} of ${formatKg(target)} kilograms` : undefined}
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
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-white">
          <TargetIcon className="size-5" strokeWidth={1.8} />
        </span>
      </div>

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="min-w-0">
          {hasCampaign ? (
            <>
              <p className="font-display text-4xl leading-10 font-extrabold tabular-nums">
                {Math.round(percent)}%
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                {formatKg(current)} of {formatKg(target)} kg
              </p>
              <p className="mt-3 text-sm">
                {completed
                  ? "Goal reached. Thank you for moving the township forward."
                  : `${campaign.daysRemaining ?? 0} days left to reach the target.`}
              </p>
              {!completed && campaign.isContributor && reward ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold">
                  <GiftIcon aria-hidden="true" className="size-3.5" />
                  +{reward} BP when the goal is reached
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
              The township office has not set a collective recycling target yet. Your personal estimates still count on your impact page.
            </p>
          )}
        </div>

        <div aria-hidden="true" className="mx-auto w-full max-w-[190px]">
          <svg viewBox="0 0 240 160" className="w-full" role="presentation">
            <defs>
              <clipPath id="recycling-turtle-shell">
                <path d="M55 82C55 42 88 22 120 22s65 20 65 60c0 34-29 54-65 54S55 116 55 82Z" />
              </clipPath>
            </defs>
            <ellipse cx="120" cy="83" rx="64" ry="54" fill="#DFF3E8" />
            <circle cx="198" cy="74" r="22" fill="#DFF3E8" />
            <path d="M76 124c-13 17-29 22-45 17 8-14 20-24 36-29M164 124c13 17 29 22 45 17-8-14-20-24-36-29" fill="#DFF3E8" />
            <path d="M66 48c-17-8-31-5-43 8 14 8 29 10 45 5M174 48c17-8 31-5 43 8-14 8-29 10-45 5" fill="#DFF3E8" />
            <path
              d="M55 82C55 42 88 22 120 22s65 20 65 60c0 34-29 54-65 54S55 116 55 82Z"
              fill="#F7FCFA"
              stroke="#0F3B45"
              strokeWidth="5"
            />
            <g clipPath="url(#recycling-turtle-shell)">
              <rect
                x="50"
                y="20"
                width="145"
                height="120"
                fill="#2F8F5B"
                style={{ transform: `translateY(${translateY}px)` }}
                className="motion-safe:transition-transform duration-700 ease-out"
              />
              <path d="M85 45l35 35 35-35M85 115l35-35 35 35M120 25v115" fill="none" stroke="#0F3B45" strokeOpacity=".28" strokeWidth="3" />
            </g>
            <path
              d="M55 82C55 42 88 22 120 22s65 20 65 60c0 34-29 54-65 54S55 116 55 82Z"
              fill="none"
              stroke="#0F3B45"
              strokeWidth="5"
            />
            <circle cx="205" cy="69" r="3.5" fill="#0F3B45" />
            <path d="M211 82c-5 4-10 4-15 1" fill="none" stroke="#0F3B45" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  )
}
