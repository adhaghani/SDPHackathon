import { cn } from "@workspace/ui/lib/utils"

export const townshipStations = [
  { name: "Pinjam", english: "Borrow" },
  { name: "Jom", english: "Events" },
  { name: "Tolong", english: "Help" },
  { name: "Rimba", english: "Impact" },
] as const

export type StationName = (typeof townshipStations)[number]["name"]

/**
 * The signature route motif. Stations before `current` are done, `current` is coral,
 * the rest are upcoming. The lilac line is decorative; state is carried by the stations.
 */
export function TownshipLine({
  current,
  details,
  tone = "light",
  className,
}: {
  current?: StationName
  details?: Partial<Record<StationName, string>>
  tone?: "light" | "ink"
  className?: string
}) {
  const currentIndex = current ? townshipStations.findIndex((station) => station.name === current) : -1
  const onInk = tone === "ink"

  return (
    <ol aria-label="Township line" className={cn("relative grid grid-cols-4", className)}>
      <span
        aria-hidden="true"
        className="absolute top-[11px] right-[12.5%] left-[12.5%] h-1.5 rounded-full bg-lilac"
      />
      {townshipStations.map((station, index) => {
        const state = index === currentIndex ? "current" : index < currentIndex ? "done" : "upcoming"
        return (
          <li
            key={station.name}
            aria-current={state === "current" ? "step" : undefined}
            className="relative flex min-w-0 flex-col items-center text-center"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-7 rounded-full border-[3px]",
                state === "current" && "border-ink bg-coral",
                state === "done" && (onInk ? "border-surface bg-surface" : "border-ink bg-ink"),
                state === "upcoming" && (onInk ? "border-lilac bg-ink" : "border-ink bg-surface")
              )}
            />
            <span
              className={cn(
                "mt-2 max-w-full truncate font-display text-sm font-bold sm:text-base",
                state === "current" && onInk ? "text-coral" : onInk ? "text-surface" : "text-ink"
              )}
            >
              {station.name}
            </span>
            <span className={cn("text-xs", onInk ? "text-band-eyebrow" : "text-ink-muted")}>
              {details?.[station.name] ?? station.english}
            </span>
            <span className="sr-only">
              {state === "done" ? ", done" : state === "current" ? ", current stop" : ", upcoming"}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
