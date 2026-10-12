import Link from "next/link"

import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { formatEventRange } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@workspace/ui/components/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

export default async function MyEventsPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [hostedResult, rsvpsResult] = await Promise.all([
    supabase.from("events").select("id,title,starts_at,ends_at,status").eq("host_id", active.user.id).order("starts_at", { ascending: false }),
    supabase.from("event_rsvps").select("id,status,events(id,title,starts_at,ends_at,status)").eq("user_id", active.user.id).order("created_at", { ascending: false }),
  ])

  const rsvps = (rsvpsResult.data ?? []).map((rsvp) => ({ ...rsvp, events: Array.isArray(rsvp.events) ? rsvp.events[0] : rsvp.events }))

  return (
    <div className="flex flex-col gap-6">
      <PageBand
        back={{ href: "/events", label: "Events" }}
        eyebrow="Jom · Mine"
        title="Your events"
        actions={<Button render={<Link href="/events/new" />} variant="cta" size="cta">Host an event</Button>}
      />
      <Tabs defaultValue="registered">
        <TabsList>
          <TabsTrigger value="registered">Registered</TabsTrigger>
          <TabsTrigger value="hosted">Hosted</TabsTrigger>
        </TabsList>
        <TabsContent value="registered">
          <ul className="bb-card mt-4 divide-y divide-hairline">
            {rsvps.map((rsvp) => (
              <li key={rsvp.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <Link href={`/events/${rsvp.events?.id}`} className="font-bold text-ink underline-offset-4 hover:underline">{rsvp.events?.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{rsvp.events ? formatEventRange(rsvp.events.starts_at, rsvp.events.ends_at) : ""}</p>
                </div>
                <StatusPill status={rsvp.status} />
              </li>
            ))}
            {!rsvps.length ? <li className="px-4 py-6 text-sm text-ink-muted">You have not registered for an event yet.</li> : null}
          </ul>
        </TabsContent>
        <TabsContent value="hosted">
          <ul className="bb-card mt-4 divide-y divide-hairline">
            {(hostedResult.data ?? []).map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <Link href={`/events/${event.id}`} className="font-bold text-ink underline-offset-4 hover:underline">{event.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{formatEventRange(event.starts_at, event.ends_at)}</p>
                </div>
                <StatusPill status={event.status} />
              </li>
            ))}
            {hostedResult.data?.length === 0 ? <li className="px-4 py-6 text-sm text-ink-muted">You have not hosted an event yet.</li> : null}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
