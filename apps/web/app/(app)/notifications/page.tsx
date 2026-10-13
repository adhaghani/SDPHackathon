import Link from "next/link"

import { markAllNotificationsRead, markNotificationRead } from "@/actions/notifications"
import { PageBand } from "@/components/shared/page-band"
import { formatRelativeDay } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { formatEventTime } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"
import { cn } from "@workspace/ui/lib/utils"

export default async function NotificationsPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const notifications = await supabase
    .from("notifications")
    .select("id,type,title,body,link,read_at,created_at")
    .eq("user_id", active.user.id)
    .order("created_at", { ascending: false })
    .limit(50)
  if (notifications.error) throw new Error(notifications.error.message)
  const rows = notifications.data ?? []
  const unread = rows.filter((row) => !row.read_at).length

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageBand
        eyebrow="Updates"
        title="Notifications"
        description={unread ? `${unread} unread. Verified points, booking changes and membership updates.` : "You're all caught up."}
        actions={
          unread > 0 ? (
            <form action={markAllNotificationsRead}>
              <Button type="submit" variant="outline" size="sm">Mark all as read</Button>
            </form>
          ) : null
        }
      />
      {rows.length ? (
        <ul className="bb-card divide-y divide-hairline">
          {rows.map((notification) => (
            <li key={notification.id} className={cn("flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap", !notification.read_at && "bg-lilac-tint/50")}>
              <span
                aria-hidden="true"
                className={cn("mt-2 size-2.5 shrink-0 rounded-full", notification.read_at ? "bg-transparent" : "bg-coral")}
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">
                  {notification.link ? (
                    <Link href={notification.link} className="hover:underline hover:underline-offset-4">{notification.title}</Link>
                  ) : (
                    notification.title
                  )}
                  {!notification.read_at ? <span className="sr-only"> (unread)</span> : null}
                </p>
                {notification.body ? <p className="mt-0.5 text-sm text-ink-muted">{notification.body}</p> : null}
                <p className="mt-1 text-xs text-ink-muted">
                  {formatRelativeDay(notification.created_at)} · {formatEventTime(notification.created_at)}
                </p>
              </div>
              {!notification.read_at ? (
                <form action={markNotificationRead} className="ml-auto shrink-0">
                  <input type="hidden" name="id" value={notification.id} />
                  <Button type="submit" variant="ghost" size="sm">Mark read</Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="bb-card">
          <EmptyHeader>
            <EmptyTitle>No notifications yet</EmptyTitle>
            <EmptyDescription>Points, booking updates and township news will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
