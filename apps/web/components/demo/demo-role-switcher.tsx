"use client"

import { useActionState } from "react"

import { continueAsDemo } from "@/actions/demo"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"

const idleState = { status: "idle" } as const

export function DemoRoleSwitcher() {
  const [state, action, pending] = useActionState(continueAsDemo, idleState)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Explore the demo as</p>
      <form action={action} className="grid gap-2 sm:flex sm:flex-wrap">
        <Button type="submit" name="role" value="resident" variant="outline" size="sm" className="w-full sm:w-auto" disabled={pending}>
          Aisyah · resident
        </Button>
        <Button type="submit" name="role" value="organiser" variant="outline" size="sm" className="w-full sm:w-auto" disabled={pending}>
          Raj · organiser
        </Button>
        <Button type="submit" name="role" value="admin" variant="outline" size="sm" className="w-full sm:w-auto" disabled={pending}>
          Township office · admin
        </Button>
        <Button type="submit" name="role" value="partner" variant="outline" size="sm" className="w-full sm:w-auto" disabled={pending}>
          Kopi Kita · partner
        </Button>
      </form>
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
