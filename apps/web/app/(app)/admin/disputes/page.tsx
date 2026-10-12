import Link from "next/link"
import { redirect } from "next/navigation"

import { ResolveDisputeForm } from "@/components/admin/admin-forms"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function AdminDisputesPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const disputes = await supabase
    .from("disputes")
    .select("id,booking_id,reason,details,status,resolution,created_at")
    .order("created_at", { ascending: false })
    .limit(50)
  if (disputes.error) throw new Error(disputes.error.message)

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm text-muted-foreground underline underline-offset-4">Back to Township Pulse</Link>
      <h1 className="mt-5 font-display text-3xl font-bold">Disputes</h1>
      <p className="mt-2 text-muted-foreground">Review both sides and record a resolution. Resolutions are audit-logged.</p>
      {(disputes.data ?? []).length ? (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {disputes.data?.map((dispute) => (
            <li key={dispute.id} className="py-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Booking issue</Badge>
                <Badge variant={dispute.status === "open" ? "secondary" : "outline"}>{dispute.status}</Badge>
              </div>
              <p className="mt-2 font-medium">{dispute.reason}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dispute.details || "No extra details provided."}</p>
              <Link href={`/borrow/bookings/${dispute.booking_id}`} className="mt-2 inline-block text-sm text-primary underline underline-offset-4">Open booking</Link>
              {dispute.status === "open" ? <div className="mt-4"><ResolveDisputeForm disputeId={dispute.id} /></div> : null}
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-6"><EmptyHeader><EmptyTitle>No disputes</EmptyTitle><EmptyDescription>Booking disputes will appear here.</EmptyDescription></EmptyHeader></Empty>
      )}
    </div>
  )
}
