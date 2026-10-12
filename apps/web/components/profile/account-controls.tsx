"use client"

import { useActionState } from "react"

import { deleteMyAccount } from "@/actions/profile"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function AccountControls() {
  const [state, action, pending] = useActionState(deleteMyAccount, idleState)

  return (
    <section className="bb-card p-5 sm:p-6">
      <h2 className="text-title text-ink">Account controls</h2>
      <p className="mt-1 text-sm text-muted-foreground">Download your own rows or permanently delete your account.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a href="/api/profile/export" download className="inline-flex h-11 items-center justify-center rounded-full border border-ink-muted px-4 text-sm font-bold text-ink hover:bg-lilac-tint">
          Download my data
        </a>
        <form
          action={action}
          onSubmit={(event) => {
            if (!window.confirm("Delete your account? This cannot be undone.")) event.preventDefault()
          }}
        >
          <Button type="submit" variant="destructive" className="h-11" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Delete my account
          </Button>
        </form>
      </div>
      {state.message ? <Alert variant="destructive" className="mt-4"><AlertDescription>{state.message}</AlertDescription></Alert> : null}
    </section>
  )
}
