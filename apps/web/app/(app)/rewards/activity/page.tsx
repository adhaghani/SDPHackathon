import { ActivityRow } from "@/components/home/activity-row"
import { PageBand } from "@/components/shared/page-band"
import { Pagination } from "@/components/shared/pagination"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { activityLine, describeActivity, formatRelativeDay } from "@/lib/activity"
import { formatEventTime } from "@/lib/format"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

const pageSize = 20

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1) || 1)
  const offset = (page - 1) * pageSize
  const supabase = await createClient()
  const result = await supabase
    .from("points_ledger")
    .select("id,delta,action_type,source_type,created_at,metadata", { count: "exact" })
    .eq("user_id", active.user.id)
    .eq("township_id", active.townshipId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1)
  if (result.error) throw new Error(result.error.message)

  const totalPages = Math.max(1, Math.ceil((result.count ?? 0) / pageSize))
  const rows = result.data ?? []

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageBand
        className="mb-0"
        back={{ href: "/rewards", label: "Impact" }}
        eyebrow="Rimba · History"
        title="All activity"
        description="Every verified BetterPoints change in this township, newest first."
      />
      {rows.length ? (
        <ul className="bb-card divide-y divide-hairline">
          {rows.map((row) => (
            <ActivityRow
              key={row.id}
              title={describeActivity(row.action_type)}
              detail={`${activityLine(row.action_type)} · ${formatRelativeDay(row.created_at)} ${formatEventTime(row.created_at)}`}
              delta={row.delta}
            />
          ))}
        </ul>
      ) : (
        <Empty className="bb-card">
          <EmptyHeader>
            <EmptyTitle>No activity yet</EmptyTitle>
            <EmptyDescription>Verified events, borrows and help will appear here with their BetterPoints.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/rewards/activity" />
    </div>
  )
}
