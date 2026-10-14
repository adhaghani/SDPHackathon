import Link from "next/link"
import { BellIcon } from "lucide-react"

export function NotificationBell({
  count,
  className = "",
  onClick,
}: {
  count: number
  className?: string
  onClick?: () => void
}) {
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications"
  return (
    <Link
      href="/notifications"
      onClick={onClick}
      aria-label={label}
      className={`relative grid size-11 place-items-center rounded-full border border-white/20 bg-ink-raised text-white transition-colors duration-150 ease-out hover:bg-white/15 ${className}`}
    >
      <BellIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-tomato px-1 text-[11px] leading-none font-bold text-ink tabular-nums ring-2 ring-ink"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  )
}
