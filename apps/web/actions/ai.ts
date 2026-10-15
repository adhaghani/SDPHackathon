"use server"

import { suggestListingFromPhoto, type ListingSuggestion } from "@/lib/ai"
import { requireActiveMember } from "@/lib/data"

export type SuggestListingState = {
  status: "idle" | "error" | "success"
  message?: string
  suggestion?: ListingSuggestion
}

export async function suggestListing(
  _state: SuggestListingState,
  formData: FormData
): Promise<SuggestListingState> {
  const imageDataUrl = formData.get("imageDataUrl")
  const fileName = formData.get("fileName")
  if (
    typeof imageDataUrl !== "string" ||
    !imageDataUrl.startsWith("data:image/") ||
    imageDataUrl.length > 4_000_000
  ) {
    return { status: "error", message: "That photo could not be read. Try another image." }
  }

  try {
    await requireActiveMember()
    const suggestion = await suggestListingFromPhoto(
      imageDataUrl,
      typeof fileName === "string" ? fileName : "photo"
    )
    return {
      status: "success",
      message: suggestion.source === "ai"
        ? "Suggestions are ready. Review and confirm every field before listing."
        : "Photo suggestions are unavailable. You can still fill in the listing details manually.",
      suggestion,
    }
  } catch {
    return { status: "error", message: "Suggestions are unavailable. You can still list manually." }
  }
}
