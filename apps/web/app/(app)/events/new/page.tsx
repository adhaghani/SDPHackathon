import { EventForm } from "@/components/events/event-form"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function NewEventPage() {
  await requireActiveMember()
  const supabase = await createClient()
  const categories = await supabase.from("event_categories").select("id,slug,name").order("name")
  if (categories.error) throw new Error(categories.error.message)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageBand
        back={{ href: "/events", label: "Events" }}
        eyebrow="Jom · Host"
        title="Create an event"
        description="Keep the location shared and welcoming. Your event will be reviewed if your township requires approval."
      />
      <div className="bb-card p-5 sm:p-7">
        <EventForm categories={categories.data ?? []} />
      </div>
    </div>
  )
}
