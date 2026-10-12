import Link from "next/link"

import { StatusPage } from "@/components/shared/status-page"
import { Button } from "@workspace/ui/components/button"

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="That page doesn't seem to exist."
      description="The route may have moved, or you may not have access to it."
      action={
        <Button
          render={<Link href="/" />}
          className="min-h-12 rounded-full bg-white px-6 text-ink hover:bg-white/90"
        >
          Go to homepage
        </Button>
      }
    />
  )
}
