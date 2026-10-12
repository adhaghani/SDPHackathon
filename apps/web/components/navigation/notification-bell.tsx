import Link from "next/link"
import { BellIcon } from "lucide-react"

export function NotificationBell({ count }: { count: number }) {
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications"
  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative grid size-11 place-items-center rounded-lg border border-hairline bg-surface text-ink transition-colors duration-150 ease-out hover:bg-ground"
    >
      <BellIcon aria-hidden="true" className="size-5" strokeWidth={1.8} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] leading-none font-bold text-ink tabular-nums ring-2 ring-surface"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  )
}
