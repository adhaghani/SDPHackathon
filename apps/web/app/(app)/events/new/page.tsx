import { EventForm } from "@/components/events/event-form"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function NewEventPage() {
  await requireActiveMember()
  const supabase = await createClient()
  const categories = await supabase.from("event_categories").select("id,slug,name").order("name")
  if (categories.error) throw new Error(categories.error.message)

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-jom-ink">Jom · Host</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold">Create an event</h1>
      <p className="mt-2 text-muted-foreground">
        Keep the location shared and welcoming. Your event will be reviewed if your township requires approval.
      </p>
      <div className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <EventForm categories={categories.data ?? []} />
      </div>
    </div>
  )
}
