"use server"

import {
  suggestGiveawayFromPhoto,
  suggestListingFromPhoto,
  type GiveawaySuggestion,
  type ListingSuggestion,
} from "@/lib/ai"
import { requireActiveMember } from "@/lib/data"

export type SuggestListingState = {
  status: "idle" | "error" | "success"
  message?: string
  suggestion?: ListingSuggestion
}

export type SuggestGiveawayState = {
  status: "idle" | "error" | "success"
  message?: string
  suggestion?: GiveawaySuggestion
}

function readPhotoInput(formData: FormData) {
  const imageDataUrl = formData.get("imageDataUrl")
  const fileName = formData.get("fileName")
  if (
    typeof imageDataUrl !== "string" ||
    !imageDataUrl.startsWith("data:image/") ||
    imageDataUrl.length > 4_000_000
  ) {
    return null
  }
  return {
    imageDataUrl,
    fileName: typeof fileName === "string" ? fileName : "photo",
  }
}

export async function suggestListing(
  _state: SuggestListingState,
  formData: FormData
): Promise<SuggestListingState> {
  const photo = readPhotoInput(formData)
  if (!photo) {
    return { status: "error", message: "That photo could not be read. Try another image." }
  }

  try {
    await requireActiveMember()
    const suggestion = await suggestListingFromPhoto(
      photo.imageDataUrl,
      photo.fileName
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

export async function suggestGiveawayListing(
  _state: SuggestGiveawayState,
  formData: FormData
): Promise<SuggestGiveawayState> {
  const photo = readPhotoInput(formData)
  if (!photo) {
    return {
      status: "error",
      message: "That photo could not be read. Try another image.",
    }
  }

  try {
    await requireActiveMember()
    const suggestion = await suggestGiveawayFromPhoto(
      photo.imageDataUrl,
      photo.fileName
    )
    return {
      status: "success",
      message:
        suggestion.source === "ai"
          ? "Details suggested from the photo. Review every field before publishing."
          : "Photo uploaded. AI suggestions are unavailable, so please add the details manually.",
      suggestion,
    }
  } catch {
    return {
      status: "error",
      message: "Photo uploaded. AI suggestions are unavailable, so please add the details manually.",
    }
  }
}
