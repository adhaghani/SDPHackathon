"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

export function SectionRetry({ label }: { label: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Alert className="my-3">
      <AlertDescription>
        <p>{label} could not load. You can still use the other sections.</p>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => startTransition(() => router.refresh())}
        >
          {pending ? "Retrying…" : `Retry ${label.toLowerCase()}`}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
