import Link from "next/link"

import { ProfileForm } from "@/components/profile/profile-form"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function ProfileSettingsPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const profile = await supabase.from("profiles").select("display_name,interests,comfort_prefs,recognition_opt_in").eq("id", active.user.id).single()
  if (profile.error || !profile.data) throw new Error(profile.error?.message ?? "Profile not found")

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/profile" className="text-sm text-muted-foreground underline underline-offset-4">Back to profile</Link>
      <h1 className="mt-5 font-heading text-3xl font-semibold">Profile settings</h1>
      <p className="mt-2 text-muted-foreground">Choose how BorrowBetter shows your name and supports your comfort.</p>
      <div className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <ProfileForm profile={{ ...profile.data, interests: profile.data.interests ?? [] }} />
      </div>
    </div>
  )
}
