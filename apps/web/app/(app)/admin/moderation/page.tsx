import Link from "next/link"
import { redirect } from "next/navigation"

import { ModerationActionButton } from "@/components/admin/admin-action-button"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function AdminModerationPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const reports = await supabase
    .from("reports")
    .select("id,target_type,target_id,reason,details,status,created_at")
    .eq("township_id", active.townshipId)
    .order("created_at", { ascending: false })
    .limit(50)
  if (reports.error) throw new Error(reports.error.message)

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">Back to Township Pulse</Link>
      <h1 className="mt-5 font-display text-3xl font-bold">Moderation</h1>
      <p className="mt-2 text-muted-foreground">Review reports and hide content when three open reports point to the same target.</p>
      {(reports.data ?? []).length ? (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {reports.data?.map((report) => (
            <li key={report.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{report.target_type}</Badge><Badge variant={report.status === "open" ? "secondary" : "outline"}>{report.status}</Badge></div>
                <p className="mt-2 font-medium">{report.reason}</p>
                <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>
              </div>
              {report.status === "open" ? (
                <div className="flex flex-wrap gap-2">
                  <ModerationActionButton reportId={report.id} action="dismiss" label="Dismiss" />
                  <ModerationActionButton reportId={report.id} action="hide" label="Hide target" />
                  <ModerationActionButton reportId={report.id} action="actioned" label="Actioned" />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-6"><EmptyHeader><EmptyTitle>No reports</EmptyTitle><EmptyDescription>Resident reports will appear here.</EmptyDescription></EmptyHeader></Empty>
      )}
    </div>
  )
}
