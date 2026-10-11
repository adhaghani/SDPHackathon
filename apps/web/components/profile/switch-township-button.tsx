"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"

import { switchTownship } from "@/actions/membership"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function SwitchTownshipButton({
  townshipId,
  name,
  current,
}: {
  townshipId: string
  name: string
  current: boolean
}) {
  const router = useRouter()
  const [, action, pending] = useActionState(switchTownship, idleState)

  if (current) {
    return <Badge variant="secondary">Current township</Badge>
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="townshipId" value={townshipId} />
      <Button type="submit" variant="outline" className="h-11" onClick={() => router.refresh()} disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        Switch to {name}
      </Button>
    </form>
  )
}
