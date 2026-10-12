"use client"

import { useActionState, useMemo, useState } from "react"

import { checkInRsvp } from "@/actions/events"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

type Registration = {
  id: string
  user_id: string
  status: string
  role: string
  checked_in_at: string | null
  profiles: { display_name: string } | null
}

export function ManualCheckInList({ registrations }: { registrations: Registration[] }) {
  const [query, setQuery] = useState("")
  const [state, action, pending] = useActionState(checkInRsvp, idleState)
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return registrations
    return registrations.filter((registration) =>
      registration.profiles?.display_name.toLowerCase().includes(needle)
    )
  }, [query, registrations])

  return (
    <div className="flex flex-col gap-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search registrations"
        aria-label="Search registrations"
      />
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <ul className="divide-y divide-border border-y border-border">
        {filtered.map((registration) => (
          <li key={registration.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{registration.profiles?.display_name ?? "Neighbour"}</p>
              <p className="text-sm text-muted-foreground">
                {registration.role === "volunteer" ? "Volunteer" : "Attendee"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {registration.status === "checked_in" ? (
                <Badge variant="outline" className="text-ink-muted">
                  Checked in
                </Badge>
              ) : (
                <form action={action}>
                  <input type="hidden" name="rsvpId" value={registration.id} />
                  <input type="hidden" name="method" value="manual" />
                  <Button type="submit" variant="outline" className="h-11" disabled={pending}>
                    {pending ? <Spinner data-icon="inline-start" /> : null}
                    Check in
                  </Button>
                </form>
              )}
            </div>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="py-6 text-sm text-muted-foreground">No registrations match that search.</li>
        ) : null}
      </ul>
    </div>
  )
}
