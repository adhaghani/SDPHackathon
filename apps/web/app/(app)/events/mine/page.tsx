import Link from "next/link"

import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { formatEventRange } from "@/lib/format"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
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
        eyebrow="Jom · Mine"
        title="Your events"
        actions={<Button render={<Link href="/events/new" />}>Host an event</Button>}
      />
      <Tabs defaultValue="registered">
        <TabsList>
          <TabsTrigger value="registered">Registered</TabsTrigger>
          <TabsTrigger value="hosted">Hosted</TabsTrigger>
        </TabsList>
        <TabsContent value="registered">
          <ul className="divide-y divide-border border-y border-border">
            {rsvps.map((rsvp) => (
              <li key={rsvp.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/events/${rsvp.events?.id}`} className="font-medium underline-offset-4 hover:underline">{rsvp.events?.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{rsvp.events ? formatEventRange(rsvp.events.starts_at, rsvp.events.ends_at) : ""}</p>
                </div>
                <Badge variant="outline">{rsvp.status.replace("_", " ")}</Badge>
              </li>
            ))}
            {!rsvps.length ? <li className="py-6 text-sm text-muted-foreground">You have not registered for an event yet.</li> : null}
          </ul>
        </TabsContent>
        <TabsContent value="hosted">
          <ul className="divide-y divide-border border-y border-border">
            {(hostedResult.data ?? []).map((event) => (
              <li key={event.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/events/${event.id}`} className="font-medium underline-offset-4 hover:underline">{event.title}</Link>
                  <p className="mt-1 text-sm text-muted-foreground">{formatEventRange(event.starts_at, event.ends_at)}</p>
                </div>
                <Badge variant="outline">{event.status}</Badge>
              </li>
            ))}
            {hostedResult.data?.length === 0 ? <li className="py-6 text-sm text-muted-foreground">You have not hosted an event yet.</li> : null}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  )
}
