import Link from "next/link"
import { redirect } from "next/navigation"

import { SupportTicketActions } from "@/components/admin/support-ticket-actions"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

export default async function AdminSupportPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const ticketsResult = await supabase
    .from("support_tickets")
    .select("id,subject,status,created_at,updated_at,requester_id,conversation_id")
    .eq("township_id", active.townshipId)
    .order("created_at", { ascending: false })
    .limit(100)
  if (ticketsResult.error) throw new Error(ticketsResult.error.message)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageBand
        back={{ href: "/admin", label: "Township Pulse" }}
        eyebrow="Township office"
        title="Support tickets"
        description="Requests created from Help. Review status without exposing private booking messages."
      />
      {(ticketsResult.data ?? []).length ? (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {ticketsResult.data?.map((ticket) => (
            <li key={ticket.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={ticket.status === "open" ? "secondary" : "outline"}>{ticket.status}</Badge>
                  <span className="text-sm text-muted-foreground">{new Date(ticket.created_at).toLocaleString("en-MY")}</span>
                </div>
                <p className="mt-2 font-medium">{ticket.subject}</p>
                {ticket.conversation_id ? (
                  <Link href="/help" className="mt-1 inline-block text-sm text-primary underline underline-offset-4">
                    Open Help centre
                  </Link>
                ) : null}
              </div>
              <SupportTicketActions ticketId={ticket.id} currentStatus={ticket.status} />
            </li>
          ))}
        </ul>
      ) : (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyTitle>No support tickets</EmptyTitle>
            <EmptyDescription>Resident Help requests will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
