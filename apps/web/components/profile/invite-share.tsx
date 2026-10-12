"use client"

import { useActionState, useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"

import { createInvite } from "@/actions/invites"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function InviteShare({ initialCode, appUrl }: { initialCode?: string; appUrl: string }) {
  const [state, action, pending] = useActionState(createInvite, idleState)
  const [copied, setCopied] = useState(false)
  const code = initialCode || state.code
  const link = code ? `${appUrl}/sign-up?invite=${code}` : ""

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copyLink() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section aria-labelledby="invite-heading" className="bb-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="invite-heading" className="text-title text-ink">Invite a neighbour</h2>
          <p className="mt-1 text-sm text-ink-muted">
            You both earn 30 BP after their first completed borrow from someone else, up to 10 rewarded invites each month.
          </p>
        </div>
        {code ? (
          <div className="rounded-lg bg-surface p-2">
            <QRCodeSVG value={link} size={112} level="M" aria-label="Invite QR code" />
          </div>
        ) : null}
      </div>
      {code ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 break-all rounded-lg bg-ground px-3 py-2 text-sm text-ink">{link}</code>
          <Button type="button" variant="outline" onClick={copyLink}>
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : (
        <form action={action} className="mt-4">
          <Button type="submit" variant="cta" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Create invite link
          </Button>
        </form>
      )}
      {state.status === "error" && state.message ? (
        <Alert variant="destructive" className="mt-3"><AlertDescription>{state.message}</AlertDescription></Alert>
      ) : null}
    </section>
  )
}
