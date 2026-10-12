"use server"

import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export type InviteActionState = {
  status: "idle" | "error" | "success"
  code?: string
  message?: string
}

export async function createInvite(
  _state: InviteActionState,
  _formData: FormData
): Promise<InviteActionState> {
  await requireActiveMember()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_or_create_invite")
  if (error) return { status: "error", message: "Your invite link could not be created." }
  const result = data as { code?: string }
  if (!result.code) return { status: "error", message: "Your invite link could not be created." }
  return { status: "success", code: result.code }
}
