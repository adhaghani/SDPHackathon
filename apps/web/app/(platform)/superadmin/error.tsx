"use client"

import { Button } from "@workspace/ui/components/button"

export default function PlatformError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 py-12">
      <h1 className="font-display text-3xl font-bold">
        Township setup could not load
      </h1>
      <p>
        Try again. If this continues, check that the platform migration and
        Supabase connection are ready.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
