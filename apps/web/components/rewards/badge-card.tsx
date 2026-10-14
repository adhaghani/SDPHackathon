import { Award, HandHeart, Leaf, Recycle, ShieldCheck, Sparkles, UsersRound } from "lucide-react"

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
  index = 0,
}: {
  name: string
  description: string
  icon: string
  earned: boolean
  progress?: number
  index?: number
}) {
  const Icon = icons[icon as keyof typeof icons] ?? Award
  const descriptionId = `badge-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-description`
  return (
    <li className="group relative min-w-0 text-center">
      <div
        tabIndex={0}
        aria-describedby={descriptionId}
        className={cn(
          "relative grid aspect-square w-full place-items-center rounded-lg transition-shadow duration-150 ease-out",
          earned
            ? "border border-hairline bg-surface shadow-card"
            : "border-2 border-dashed border-ink-muted bg-ground"
        )}
      >
        {earned ? (
          <span aria-hidden="true" className={cn("grid size-[45%] place-items-center rounded-full", fills[index % fills.length])}>
            <Icon className="size-1/2 text-ink" strokeWidth={2} />
          </span>
        ) : (
          <Icon aria-hidden="true" className="size-[35%] text-ink-muted" strokeWidth={1.4} />
        )}
        {!earned && progress !== undefined ? (
          <span aria-hidden="true" className="absolute inset-x-3 bottom-3 h-1.5 overflow-hidden rounded-full bg-hairline">
            <span className="block h-full rounded-full bg-ink-muted" style={{ width: `${progress}%` }} />
          </span>
        ) : null}
      </div>
      <p className={cn("mt-2 line-clamp-2 text-sm leading-tight font-bold", earned ? "text-ink" : "text-ink-muted")}>
        {name}
        <span className="sr-only">{earned ? ", earned" : progress !== undefined ? `, locked, ${progress}% of the way` : ", locked"}</span>
      </p>
      <p
        id={descriptionId}
        className="pointer-events-none absolute inset-x-0 top-full z-10 mt-1 hidden rounded-md bg-ink p-2 text-xs leading-snug text-surface shadow-raised md:group-focus-within:block md:group-hover:block"
      >
        {description}
      </p>
    </li>
  )
}
