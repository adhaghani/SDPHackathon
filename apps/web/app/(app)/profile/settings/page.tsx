import { PageBand } from "@/components/shared/page-band"
import { ProfileForm } from "@/components/profile/profile-form"
import { AccountControls } from "@/components/profile/account-controls"
import { NotificationPreferences } from "@/components/profile/notification-preferences"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function ProfileSettingsPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const profile = await supabase.from("profiles").select("display_name,interests,comfort_prefs,recognition_opt_in").eq("id", active.user.id).single()
  if (profile.error || !profile.data) throw new Error(profile.error?.message ?? "Profile not found")
  const preferenceRows = await supabase.from("notification_preferences").select("type,enabled").eq("user_id", active.user.id)
  if (preferenceRows.error) throw new Error(preferenceRows.error.message)
  const preferences = Object.fromEntries((preferenceRows.data ?? []).map((row) => [row.type, row.enabled]))

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageBand
        back={{ href: "/profile", label: "Profile" }}
        eyebrow="Settings"
        title="Profile and comfort"
        description="Choose how BorrowBetter shows your name and supports your comfort."
      />
      <div className="bb-card p-5 sm:p-7">
        <ProfileForm profile={{ ...profile.data, interests: profile.data.interests ?? [] }} />
      </div>
      <AccountControls />
      <NotificationPreferences preferences={preferences} />
    </div>
  )
}
