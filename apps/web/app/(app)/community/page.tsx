import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { CommunityForms } from "@/components/community/community-forms"
import { GroupActionButton, HelpActionButton } from "@/components/community/community-action"
import { ReportForm } from "@/components/reports/report-form"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

export default async function CommunityPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [announcementsResult, helpResult, groupsResult, joinedResult] = await Promise.all([
    supabase.from("announcements").select("id,title,body,pinned,published_at").eq("township_id", active.townshipId).order("pinned", { ascending: false }).order("published_at", { ascending: false }),
    supabase.from("help_requests").select("id,title,details,kind,status,needed_by,requester_id,helper_id").eq("township_id", active.townshipId).order("created_at", { ascending: false }),
    supabase.from("interest_groups").select("id,name,description").eq("township_id", active.townshipId).order("name"),
    supabase.from("group_members").select("group_id").eq("user_id", active.user.id),
  ])
  const joined = new Set((joinedResult.data ?? []).map((row) => row.group_id))
  const helpRequests = helpResult.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        eyebrow="Tolong · Community"
        title="Neighbourhood help"
        description="Meet in shared spaces. Never share bank or ID details."
      />

      <CommunityForms role={active.membership?.role ?? "resident"} />

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="help">Neighbours who need help</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements">
          {(announcementsResult.data ?? []).length ? (
            <ul className="divide-y divide-border border-y border-border">
              {announcementsResult.data?.map((announcement) => (
                <li key={announcement.id} className="py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.pinned ? <Badge variant="secondary">Pinned</Badge> : null}
                    <span className="text-sm text-muted-foreground">{new Date(announcement.published_at).toLocaleDateString("en-MY")}</span>
                  </div>
                  <h2 className="mt-2 font-display text-lg">{announcement.title}</h2>
                  <p className="mt-2 max-w-3xl leading-7">{announcement.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="mt-4"><EmptyHeader><EmptyTitle>No announcements yet</EmptyTitle><EmptyDescription>Organisers and the township office can share updates here.</EmptyDescription></EmptyHeader></Empty>
          )}
        </TabsContent>
        <TabsContent value="help">
          {helpRequests.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {helpRequests.map((request) => (
                <li key={request.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{request.kind.replace("_", " ")}</Badge>
                      <Badge variant={request.status === "open" ? "secondary" : "outline"}>{request.status}</Badge>
                    </div>
                    <h2 className="mt-2 font-display text-lg">{request.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.details}</p>
                    {request.needed_by ? <p className="mt-2 text-sm text-muted-foreground">Needed by {new Date(request.needed_by).toLocaleDateString("en-MY")}</p> : null}
                  </div>
                  {request.status === "open" && request.requester_id !== active.user.id ? <HelpActionButton requestId={request.id} action="accept" /> : null}
                  {request.status === "accepted" && request.requester_id === active.user.id ? <HelpActionButton requestId={request.id} action="complete" /> : null}
                  <ReportForm townshipId={active.townshipId} targetType="help_request" targetId={request.id} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty className="mt-4"><EmptyHeader><EmptyTitle>No helping requests</EmptyTitle><EmptyDescription>Ask for practical help when you need a hand.</EmptyDescription></EmptyHeader></Empty>
          )}
        </TabsContent>
        <TabsContent value="groups">
          <ul className="grid gap-3 sm:grid-cols-2">
            {(groupsResult.data ?? []).map((group) => (
              <li key={group.id} className="bb-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="font-display text-lg">{group.name}</h2><p className="mt-1 text-sm text-muted-foreground">{group.description}</p></div>
                  <Badge variant="outline">{joined.has(group.id) ? "Joined" : "Open"}</Badge>
                </div>
                <div className="mt-4"><GroupActionButton groupId={group.id} joined={joined.has(group.id)} /></div>
              </li>
            ))}
            {groupsResult.data?.length === 0 ? <li className="bb-card p-5 text-sm text-muted-foreground sm:col-span-2">No interest groups yet.</li> : null}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
