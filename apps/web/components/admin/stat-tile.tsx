import Link from "next/link"

import { cn } from "@workspace/ui/lib/utils"

export function StatTile({
  label,
  value,
  detail,
  estimated = false,
}: {
  label: string
  value: string
  detail?: string
  estimated?: boolean
}) {
  return (
    <div className={cn("bb-card min-w-0 p-5", estimated && "border-mint-tint bg-mint-tint")}>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-2 truncate font-display text-[40px] leading-none font-extrabold text-ink tabular-nums">{value}</p>
      {estimated ? (
        <p className="mt-2 text-sm font-bold text-ink">
          Estimated ·{" "}
          <Link href="/admin/methodology" className="underline underline-offset-4">
            see methodology
          </Link>
        </p>
      ) : detail ? (
        <p className="mt-2 text-sm font-bold text-ink">{detail}</p>
      ) : null}
    </div>
  )
}
