"use client"

import { useActionState, useEffect, useState } from "react"
import { CopyIcon, QrCodeIcon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import { createInvite } from "@/actions/invites"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function InviteShare({
  initialCode,
  appUrl,
}: {
  initialCode?: string
  appUrl: string
}) {
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
          <h2 id="invite-heading" className="text-title text-ink">
            Invite a neighbour
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            You both earn 30 BP after their first completed borrow from someone
            else, up to 10 rewarded invites each month.
          </p>
        </div>
      </div>
      {code ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={copyLink}>
            <CopyIcon data-icon="inline-start" />
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Dialog>
            <DialogTrigger
              render={
                <Button type="button" variant="outline">
                  <QrCodeIcon data-icon="inline-start" />
                  Show QR code
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader className="items-center text-center">
                <DialogTitle>Invite QR code</DialogTitle>
                <DialogDescription>
                  Ask your neighbour to scan this code to open your invite link.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG
                    value={link}
                    size={192}
                    level="M"
                    aria-label="Invite QR code"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
