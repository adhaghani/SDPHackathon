"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { profileSchema } from "@/lib/validation/profile"

export type ProfileActionState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function updateProfile(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    interests: formData.getAll("interests").map(String),
    largeText: formData.get("largeText") === "on",
    highContrast: formData.get("highContrast") === "on",
    reduceMotion: formData.get("reduceMotion") === "on",
    recognitionOptIn: formData.get("recognitionOptIn") === "on",
    showInHighlights: formData.get("showInHighlights") === "on",
  })

  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: "Check the highlighted fields.",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("update_profile", {
    p_display_name: parsed.data.displayName,
    p_interests: parsed.data.interests,
    p_comfort_prefs: {
      large_text: parsed.data.largeText,
      high_contrast: parsed.data.highContrast,
      reduce_motion: parsed.data.reduceMotion,
    },
    p_recognition_opt_in: parsed.data.recognitionOptIn,
    p_show_in_highlights: parsed.data.showInHighlights,
  })

  if (error) {
    return { status: "error", message: "Your profile could not be updated. Try again." }
  }

  revalidatePath("/profile")
  revalidatePath("/profile/settings")
  return { status: "success", message: "Profile updated." }
}

export async function deleteMyAccount(
  _state: ProfileActionState
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { status: "error", message: "Sign in before deleting your account." }

  const { error } = await supabase.rpc("delete_my_account")
  if (error) return { status: "error", message: "Your account could not be deleted. Try again." }

  const { getAdminClient } = await import("@/lib/supabase/admin")
  await getAdminClient().auth.admin.deleteUser(user.id)
  redirect("/sign-in?message=Your+account+was+deleted.")
}
