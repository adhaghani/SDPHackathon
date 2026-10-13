import { CheckIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

export function HandoverSteps({
  currentStep = 0,
  completed = [],
  compact = false,
}: {
  currentStep?: 0 | 1 | 2
  completed?: number[]
  compact?: boolean
}) {
  const steps = [
    ["Request approved", "The lender accepts your dates."],
    ["Both confirm pick-up", "Meet at the shared handover spot."],
    ["Both confirm return", "Close the loop and earn BetterPoints."],
  ]

  return (
    <ol className={cn("flex flex-col", compact ? "gap-3" : "gap-4")}>
      {steps.map(([label, detail], index) => {
        const done = completed.includes(index)
        const current = currentStep === index && !done
        return (
          <li key={label} aria-current={current ? "step" : undefined} className="relative flex gap-3">
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="absolute top-7 left-[13px] h-[calc(100%-12px)] w-0.5 bg-hairline" />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-ink",
                done ? "border-ink bg-ink text-white" : current ? "border-ink bg-tomato" : "border-hairline bg-white"
              )}
            >
              {done ? <CheckIcon className="size-4" strokeWidth={3} /> : <span className="text-xs font-bold">{index + 1}</span>}
            </span>
            <span className="min-w-0 pb-1">
              <span className={cn("block text-[15px] leading-5 font-bold", current || done ? "text-ink" : "text-ink-soft")}>{label}</span>
              {!compact ? <span className="mt-0.5 block text-sm leading-[19px] text-ink-soft">{detail}</span> : null}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
