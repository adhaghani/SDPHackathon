import { CopyCodeButton } from "@/components/rewards/copy-code-button"
import { formatEventDate } from "@/lib/format"

export function VoucherCard({
  title,
  partnerName,
  code,
  costBp,
  redeemedAt,
  validUntil,
}: {
  title: string
  partnerName?: string | null
  code: string
  costBp: number
  redeemedAt: string
  validUntil?: string | null
}) {
  return (
    <li className="flex min-w-0 overflow-hidden rounded-lg bg-surface shadow-card">
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <p className="text-eyebrow text-ink-muted">{partnerName ?? "Township reward"}</p>
        <p className="text-title mt-1 text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-muted tabular-nums">
          {costBp.toLocaleString("en-MY")} BP · redeemed {formatEventDate(redeemedAt)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
          <code className="rounded-md border-2 border-dashed border-ink-muted px-3 py-1.5 font-mono text-lg font-bold tracking-[0.2em] text-ink">
            {code}
          </code>
          <CopyCodeButton code={code} />
        </div>
      </div>
      <div aria-hidden="true" className="relative w-0 border-l-2 border-dashed border-hairline">
        <span className="absolute -top-2.5 -left-2.5 size-5 rounded-full bg-background" />
        <span className="absolute -bottom-2.5 -left-2.5 size-5 rounded-full bg-background" />
      </div>
      <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 bg-mint-tint p-3 text-center text-ink sm:w-28">
        <span className="text-xs font-bold">Ready to use</span>
        {validUntil ? <span className="text-xs">until {formatEventDate(validUntil).replace(/ \d{4}$/, "")}</span> : null}
      </div>
    </li>
  )
}
