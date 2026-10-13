"use client"

import { useState, useTransition } from "react"
import { BookmarkIcon } from "lucide-react"

import { toggleSavedItem } from "@/actions/saved"
import { cn } from "@workspace/ui/lib/utils"

export function SaveItemButton({
  itemId,
  initiallySaved = false,
  className,
}: {
  itemId: string
  initiallySaved?: boolean
  className?: string
}) {
  const [saved, setSaved] = useState(initiallySaved)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  const handleToggle = () => {
    if (pending) return

    const next = !saved
    setSaved(next)
    setError("")

    startTransition(async () => {
      try {
        const result = await toggleSavedItem(itemId, next)

        if (result.status === "error") {
          setSaved(!next)
          setError(
            result.message ?? "We could not update your saved item. Try again."
          )
          return
        }

        setSaved(result.saved ?? next)
      } catch {
        setSaved(!next)
        setError("We could not update your saved item. Try again.")
      }
    })
  }

  return (
    <>
      <button
        type="button"
        aria-label={saved ? "Remove saved item" : "Save item"}
        aria-pressed={saved}
        aria-busy={pending}
        onClick={handleToggle}
        disabled={pending}
        title={error || (saved ? "Remove from saved items" : "Save for later")}
        className={cn(
          "grid size-11 place-items-center rounded-full bg-white text-ink transition-colors duration-150 ease-out hover:bg-paper disabled:cursor-wait disabled:opacity-70",
          className
        )}
      >
        <BookmarkIcon
          aria-hidden="true"
          className={cn("size-[22px]", saved && "fill-ink")}
          strokeWidth={2}
        />
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {error}
      </span>
    </>
  )
}
