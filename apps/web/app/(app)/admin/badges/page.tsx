import type { BadgeDefinition, BadgeCriteria } from "@/lib/badges"
import { redirect } from "next/navigation"
import { PageBand } from "@/components/shared/page-band"

import { BadgeForm } from "@/components/admin/badge-form"
import { BadgeCard } from "@/components/rewards/badge-card"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function AdminBadgesPage() {
  const active = await requireActiveMember()
  if (active.membership?.role !== "township_admin") redirect("/home")
  const supabase = await createClient()
  const badges = await supabase
    .from("badges")
    .select("slug,name,description,icon,criteria")
    .order("created_at")
  if (badges.error) throw new Error(badges.error.message)

  return (
    <div className="flex flex-col gap-7">
      <div>
        <PageBand
          back={{ href: "/admin", label: "Township Pulse" }}
          eyebrow="Township office"
          title="Awards catalogue"
          description="Manage the shared awards catalogue and the verified activities required to earn each badge. Changes apply across townships."
        />
      </div>
      <section className="bb-card p-5">
        <h2 className="font-display text-lg font-bold">
          Add or update an award
        </h2>
        <div className="mt-4">
          <BadgeForm badges={(badges.data ?? []) as BadgeDefinition[]} />
        </div>
      </section>
      <section>
        <h2 className="font-display text-lg font-bold">Current awards</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(badges.data ?? []).map((badge) => (
            <BadgeCard
              key={badge.slug}
              name={badge.name}
              description={badge.description}
              icon={badge.icon}
              earned={false}
              criteria={badge.criteria as BadgeCriteria}
              catalogue
            />
          ))}
        </ul>
      </section>
    </div>
  )
}
