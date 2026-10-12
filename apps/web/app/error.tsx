"use client"

import { useEffect } from "react"

import { StatusPage } from "@/components/shared/status-page"
import { Button } from "@workspace/ui/components/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <StatusPage
      code="Error"
      title="Something went wrong."
      description="Try again, or return to Home. Your data is not lost."
      action={
        <Button
          type="button"
          onClick={reset}
          className="min-h-12 rounded-full bg-white px-6 text-ink hover:bg-white/90"
        >
          Try again
        </Button>
      }
    />
  )
}
