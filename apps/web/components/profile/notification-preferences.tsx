"use client"

import { useActionState } from "react"

import { setNotificationPreference } from "@/actions/notifications"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"

const idleState = { status: "idle" } as const
const types = [
  ["points_awarded", "Points awarded"],
  ["badge_earned", "Badge earned"],
  ["level_up", "Level up"],
  ["booking_update", "Booking updates"],
  ["event_update", "Event updates"],
  ["announcement", "Announcements"],
  ["challenge_complete", "Challenge complete"],
] as const

export function NotificationPreferences({
  preferences,
}: {
  preferences: Record<string, boolean>
}) {
  const [, action] = useActionState(setNotificationPreference, idleState)

  return (
    <section className="bb-card p-5 sm:p-6">
      <h2 className="text-title text-ink">Notification preferences</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose which updates should reach your bell.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {types.map(([type, label]) => (
          <form action={action} key={type} className="flex items-center gap-3">
            <input type="hidden" name="type" value={type} />
            <Checkbox id={`notification-${type}`} name="enabled" defaultChecked={preferences[type] ?? true} aria-label={label} />
            <FieldLabel htmlFor={`notification-${type}`}>{label}</FieldLabel>
          </form>
        ))}
      </div>
    </section>
  )
}
