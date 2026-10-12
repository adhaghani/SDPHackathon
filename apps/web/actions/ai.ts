"use server"

import { suggestListingFromPhoto, type ListingSuggestion } from "@/lib/ai"

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
    const suggestion = await suggestListingFromPhoto(
      imageDataUrl,
      typeof fileName === "string" ? fileName : "photo"
    )
    return {
      status: "success",
      message: suggestion.source === "ai"
        ? "Suggestions are ready. Review and confirm every field before listing."
        : "The photo is ready. Fill in the details manually, or add an AI key for suggestions.",
      suggestion,
    }
  } catch {
    return { status: "error", message: "Suggestions are unavailable. You can still list manually." }
  }
}
