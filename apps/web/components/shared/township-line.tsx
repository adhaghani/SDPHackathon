import { cn } from "@workspace/ui/lib/utils"

type LineName = "Pinjam" | "Jom" | "Tolong" | "Rimba"

const lineStyles: Record<
  LineName,
  { line: string; dot: string; text: string }
> = {
  Pinjam: {
    line: "bg-line-borrow",
    dot: "bg-line-borrow",
    text: "text-primary",
  },
  Jom: {
    line: "bg-line-event",
    dot: "bg-line-event",
    text: "text-ink-muted",
  },
  Tolong: {
    line: "bg-line-help",
    dot: "bg-line-help",
    text: "text-ink-muted",
  },
  Rimba: {
    line: "bg-line-impact",
    dot: "bg-line-impact",
    text: "text-ink-muted",
  },
}

export function TownshipLine({
  stops,
  className,
}: {
  stops: ReadonlyArray<{ label: string; line: LineName }>
  className?: string
}) {
  return (
    <ol
      className={cn(
        "bb-card grid gap-0 border-l-4 border-l-coral p-5 text-ink sm:p-6",
        className
      )}
    >
      {stops.map(({ label, line }) => {
        const styles = lineStyles[line]

        return (
          <li key={`${line}-${label}`} className="relative py-4 pl-5">
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-6 -left-[31px] size-3.5 rounded-full border-4 border-card",
                styles.dot
              )}
            />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{label}</span>
              <span className={cn("text-xs font-bold", styles.text)}>
                {line}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
