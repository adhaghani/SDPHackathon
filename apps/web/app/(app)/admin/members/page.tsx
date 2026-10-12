import Link from "next/link"
import { redirect } from "next/navigation"

import { MemberActionButton } from "@/components/admin/admin-action-button"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function AdminMembersPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const members = await supabase
    .from("township_members")
    .select("id,user_id,role,status,created_at")
    .eq("township_id", active.townshipId)
    .order("created_at", { ascending: false })
  if (members.error) throw new Error(members.error.message)
  const userIds = (members.data ?? []).map((member) => member.user_id)
  const profiles = userIds.length
    ? await supabase.from("profiles").select("id,display_name").in("id", userIds)
    : { data: [], error: null }
  if (profiles.error) throw new Error(profiles.error.message)
  const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.display_name]))

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">Back to Township Pulse</Link>
      <h1 className="mt-5 font-display text-3xl font-bold">Members</h1>
      <p className="mt-2 text-muted-foreground">Approve or reject pending township membership requests.</p>
      {(members.data ?? []).length ? (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {members.data?.map((member) => (
            <li key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{names.get(member.user_id) ?? "Neighbour"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{member.role} · {new Date(member.created_at).toLocaleDateString("en-MY")}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={member.status === "active" ? "secondary" : "outline"}>{member.status}</Badge>
                {member.status === "pending" ? (
                  <div className="flex gap-2"><MemberActionButton memberId={member.id} approve /><MemberActionButton memberId={member.id} approve={false} /></div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-6"><EmptyHeader><EmptyTitle>No members yet</EmptyTitle><EmptyDescription>Membership requests will appear here.</EmptyDescription></EmptyHeader></Empty>
      )}
    </div>
  )
}
