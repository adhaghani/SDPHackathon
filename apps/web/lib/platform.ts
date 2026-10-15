import "server-only"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requirePlatformAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/superadmin")
  const { data, error } = await supabase.rpc("is_platform_admin")
  if (error || !data) redirect("/home")
  return { supabase, user }
}

export async function getPlatformTownships() {
  const { supabase } = await requirePlatformAdmin()
  const { data, error } = await supabase
    .from("townships")
    .select(
      "id,name,slug,join_code,state,district,description,boundary,lifecycle,auto_approve_members,require_event_approval,neighbourhoods(id,name)"
    )
    .order("created_at", { ascending: false })
  if (error)
    throw new Error(
      "Could not load townships. Check that the platform migration has been applied."
    )
  return data
}

export type PlatformTownship = Awaited<
  ReturnType<typeof getPlatformTownships>
>[number]
