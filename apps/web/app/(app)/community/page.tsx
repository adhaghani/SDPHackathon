import { GroupActionButton, HelpActionButton } from "@/components/community/community-action"
import { CommunityForms } from "@/components/community/community-forms"
import { ReportForm } from "@/components/reports/report-form"
import { PageBand } from "@/components/shared/page-band"
import { formatRelativeDay } from "@/lib/activity"
import { requireActiveMember } from "@/lib/data"
import { formatEventDate } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@workspace/ui/lib/utils"

const statusStyles: Record<string, string> = {
  open: "bg-mint-tint",
  accepted: "bg-lilac-tint",
  completed: "bg-ground",
}

export default async function CommunityPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [announcementsResult, helpResult, groupsResult, joinedResult] = await Promise.all([
    supabase.from("announcements").select("id,title,body,pinned,published_at").eq("township_id", active.townshipId).order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(6),
    supabase.from("help_requests").select("id,title,details,kind,status,needed_by,requester_id,helper_id").eq("township_id", active.townshipId).order("created_at", { ascending: false }),
    supabase.from("interest_groups").select("id,name,description").eq("township_id", active.townshipId).order("name"),
    supabase.from("group_members").select("group_id").eq("user_id", active.user.id),
  ])
  const joined = new Set((joinedResult.data ?? []).map((row) => row.group_id))
  const helpRequests = helpResult.data ?? []
  const announcements = announcementsResult.data ?? []
  const groups = groupsResult.data ?? []

  const openCount = helpRequests.filter((request) => request.status === "open").length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageBand
        className="mb-0"
        eyebrow="Tolong · Community"
        title="Community"
        description={
          <>
            Practical help between neighbours. Meet in shared spaces and never share bank or ID details.
            <span className="mt-1 block font-bold text-ink tabular-nums">
              {openCount} open {openCount === 1 ? "request" : "requests"} · {joined.size} {joined.size === 1 ? "group" : "groups"} joined
            </span>
          </>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start xl:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          {announcements.length ? (
            <section aria-labelledby="announcements-heading">
              <h2 id="announcements-heading" className="text-heading text-ink">From the township office</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {announcements.map((announcement) => (
                  <li
                    key={announcement.id}
                    className={cn("rounded-lg p-4 sm:p-5", announcement.pinned ? "bg-lilac-tint" : "border border-hairline bg-surface")}
                  >
                    <p className="text-eyebrow text-ink-muted">
                      {announcement.pinned ? "Pinned · " : ""}
                      {formatRelativeDay(announcement.published_at)}
                    </p>
                    <h3 className="text-title mt-1 text-ink">{announcement.title}</h3>
                    <p className="mt-1.5 max-w-[72ch] text-ink">{announcement.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="help-heading">
            <h2 id="help-heading" className="text-heading text-ink">Needs a hand</h2>
            {helpRequests.length ? (
              <ul className="bb-card mt-4 divide-y divide-hairline">
                {helpRequests.map((request) => {
                  const mine = request.requester_id === active.user.id
                  const canHelp = request.status === "open" && !mine
                  const canComplete = request.status === "accepted" && mine
                  return (
                    <li key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold text-ink capitalize", statusStyles[request.status] ?? "bg-ground")}>
                            {request.status}
                          </span>
                          <span className="text-sm text-ink-muted first-letter:uppercase">{request.kind.replaceAll("_", " ")}</span>
                          {request.needed_by ? (
                            <span className="text-sm text-ink-muted">· needed by <strong className="text-ink">{formatEventDate(request.needed_by)}</strong></span>
                          ) : null}
                          {mine ? <span className="text-sm font-bold text-ink">· Your request</span> : null}
                        </div>
                        <h3 className="text-title mt-2 text-ink">{request.title}</h3>
                        {request.details ? <p className="mt-1 max-w-[68ch] text-ink-muted">{request.details}</p> : null}
                        {!mine ? (
                          <div className="mt-1">
                            <ReportForm townshipId={active.townshipId} targetType="help_request" targetId={request.id} />
                          </div>
                        ) : null}
                      </div>
                      {canHelp || canComplete ? (
                        <div className="shrink-0 sm:pt-6">
                          <HelpActionButton requestId={request.id} action={canHelp ? "accept" : "complete"} />
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg border border-hairline bg-surface p-5 text-ink-muted">
                No one needs a hand right now. When you do, ask using the form{" "}
                <span className="xl:hidden">below</span>
                <span className="max-xl:hidden">beside this list</span>.
              </p>
            )}
          </section>
        </div>

        <aside className="grid gap-6 md:grid-cols-2 md:items-start xl:grid-cols-1">
          <div id="ask">
            <CommunityForms role={active.membership?.role ?? "resident"} />
          </div>
          <section aria-labelledby="groups-heading" className="bb-card p-5">
            <h2 id="groups-heading" className="text-title text-ink">Interest groups</h2>
            {groups.length ? (
              <ul className="mt-2 divide-y divide-hairline">
                {groups.map((group) => (
                  <li key={group.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink">{group.name}</p>
                      {group.description ? <p className="line-clamp-2 text-sm text-ink-muted">{group.description}</p> : null}
                    </div>
                    <GroupActionButton groupId={group.id} joined={joined.has(group.id)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">No interest groups yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
