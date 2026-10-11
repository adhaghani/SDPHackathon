"use client"

import { useEffect } from "react"

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
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-4">
      <p className="text-sm font-medium text-jom-ink">Something went wrong</p>
      <h1 className="mt-2 font-heading text-3xl font-semibold">This page could not load</h1>
      <p className="mt-3 text-muted-foreground">Try again, or return to Home. Your data is not lost.</p>
      <Button type="button" className="mt-6 h-11" onClick={reset}>Try again</Button>
    </main>
  )
}
