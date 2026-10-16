import Link from "next/link"
import { ArrowUpRightIcon, RecycleIcon } from "lucide-react"

import type { RecyclingSummary } from "@/components/recycling/types"
import { Button } from "@workspace/ui/components/button"
import { RecyclingGuideDialog } from "@/components/recycling/recycling-guide-dialog"

function formatKg(value: number) {
  return `${value.toLocaleString("en-MY", { maximumFractionDigits: 1 })} kg`
}

function formatKwh(value: number) {
  return `${value.toLocaleString("en-MY", { maximumFractionDigits: 1 })} kWh`
}

export function RecyclingImpactSummary({
  summary,
  compact = false,
  guideCompleted = false,
  guideRewardPoints = 5,
}: {
  summary: RecyclingSummary
  compact?: boolean
  guideCompleted?: boolean
  guideRewardPoints?: number
}) {
  const ledHours =
    summary.energyKwh == null
      ? null
      : Math.max(1, Math.round(summary.energyKwh * 100))

  return (
    <section
      aria-labelledby="recycling-impact-heading"
      className={compact ? "" : "bb-card p-5 sm:p-6"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow text-ink-muted">
            Rimba · Self-reported estimates
          </p>
          <h2 id="recycling-impact-heading" className="mt-1 text-h2 text-ink">
            Your recycling impact
          </h2>
          <p className="mt-1 max-w-[58ch] text-body text-ink-soft">
            A practical estimate from what you chose to recycle. Figures are
            estimated, not weighed or guaranteed.
          </p>
        </div>
        {compact ? null : (
          <div className="flex flex-wrap gap-2">
            <RecyclingGuideDialog
              completed={guideCompleted}
              rewardPoints={guideRewardPoints}
            />
            <Button
              render={<Link href="/recycling" />}
              variant="cta"
              className="shrink-0"
            >
              <RecycleIcon aria-hidden="true" className="size-4" />
              Log recycling
            </Button>
          </div>
        )}
      </div>

      <dl className="mt-6 grid gap-5 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-ink-muted">Recycled</dt>
          <dd className="mt-1">
            <span className="block font-display text-3xl leading-8 font-extrabold text-ink tabular-nums">
              {formatKg(summary.lifetimeKg)}
            </span>
            <span className="mt-1 block text-xs text-ink-soft tabular-nums">
              +{formatKg(summary.monthKg)} this month
            </span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-ink-muted">CO₂e avoided</dt>
          <dd className="mt-1">
            <span className="block font-display text-3xl leading-8 font-extrabold text-ink tabular-nums">
              {summary.co2eAvailable && summary.co2eKg != null ? (
                formatKg(summary.co2eKg)
              ) : (
                <span className="text-xl text-ink-soft">
                  Methodology pending
                </span>
              )}
            </span>
            <span className="mt-1 block text-xs text-ink-soft">
              Estimated using cited material factors
            </span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm font-semibold text-ink-muted">Energy saved</dt>
          <dd className="mt-1">
            <span className="block font-display text-3xl leading-8 font-extrabold text-ink tabular-nums">
              {summary.energyAvailable && summary.energyKwh != null ? (
                formatKwh(summary.energyKwh)
              ) : (
                <span className="text-xl text-ink-soft">
                  Methodology pending
                </span>
              )}
            </span>
            <span className="mt-1 block text-xs text-ink-soft">
              {ledHours != null
                ? `About ${ledHours.toLocaleString("en-MY")} ${ledHours === 1 ? "hour" : "hours"} of LED light`
                : "Energy equivalent in kWh"}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="text-xs text-ink-soft">
          See material-by-material totals and recent estimates.
        </p>
        <Link
          href="/recycling"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-ink underline underline-offset-4 hover:no-underline"
        >
          Open recycling history
          <ArrowUpRightIcon aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  )
}
