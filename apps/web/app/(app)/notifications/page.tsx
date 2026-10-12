import { markNotificationRead } from "@/actions/notifications"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

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

  return (
    <div className="mx-auto max-w-3xl">
      <PageBand
        eyebrow="Updates"
        title="Notifications"
        description="Verified points, booking changes and membership updates appear here."
      />
      {(notifications.data ?? []).length ? (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {notifications.data?.map((notification) => (
            <li key={notification.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={notification.read_at ? "outline" : "secondary"}>{notification.read_at ? "Read" : "New"}</Badge>
                  <span className="text-sm text-muted-foreground">{new Date(notification.created_at).toLocaleString("en-MY")}</span>
                </div>
                <p className="mt-2 font-bold">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
              </div>
              {!notification.read_at ? (
                <form action={markNotificationRead}>
                  <input type="hidden" name="id" value={notification.id} />
                  <Button type="submit" variant="outline" className="h-11">Mark read</Button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-6">
          <EmptyHeader><EmptyTitle>No notifications</EmptyTitle><EmptyDescription>Points and booking updates will appear here.</EmptyDescription></EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
