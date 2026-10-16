"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { CheckIcon, CopyIcon, DownloadIcon, Share2Icon } from "lucide-react"
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react"

import { shareGuestPass } from "@/actions/guest-pass"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"

export function GuestPassShareDetails({ token, shortCode }: { token: string; shortCode: string }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const canvasRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setShareUrl(`${window.location.origin}/pass/${token}`)
  }, [token])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setCopyError(false)
    } catch {
      setCopied(false)
      setCopyError(true)
      linkRef.current?.focus()
      linkRef.current?.select()
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current?.querySelector("canvas")
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "borrowlah-guest-pass.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-[22px] bg-white p-4 ring-2 ring-ink">
          <QRCodeSVG value={shareUrl} size={220} level="M" title="Guest access QR code" bgColor="#ffffff" fgColor="#111111" />
        </div>
        <div ref={canvasRef} className="hidden" aria-hidden="true">
          {shareUrl ? <QRCodeCanvas value={shareUrl} size={512} level="M" includeMargin /> : null}
        </div>
        <div className="rounded-full bg-ink px-4 py-2 font-mono text-lg font-bold tracking-[0.3em] text-white">{shortCode}</div>
        <Input ref={linkRef} aria-label="Guest pass share link" readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
        <p role="status" className="text-center text-sm text-ink-soft">
          {copyError ? "Copy failed. Select and copy the link above." : copied ? "Link copied." : "You can reopen this link from Share pass while the pass is active."}
        </p>
      </div>
      <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button type="button" variant="outline" onClick={() => void copyLink()} disabled={!shareUrl}>
          {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button type="button" variant="outline" disabled={!shareUrl} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Guest pass for BorrowLah: ${shareUrl}`)}`, "_blank", "noopener,noreferrer")}>
          <Share2Icon data-icon="inline-start" />
          WhatsApp
        </Button>
        <Button type="button" variant="cta" onClick={downloadPng} disabled={!shareUrl}>
          <DownloadIcon data-icon="inline-start" />
          Download PNG
        </Button>
      </DialogFooter>
    </>
  )
}

export function SavedGuestPassShareButton({ passId }: { passId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(shareGuestPass, { status: "idle" })

  return (
    <>
      <form action={action}>
        <input type="hidden" name="passId" value={passId} />
        <Button type="submit" size="sm" onClick={() => setOpen(true)} disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <Share2Icon data-icon="inline-start" />}
          Share pass
        </Button>
      </form>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share guest pass</DialogTitle>
            <DialogDescription>Send this private link to your visitor. They can open it without signing in and show the QR at the gate.</DialogDescription>
          </DialogHeader>
          {pending ? (
            <p role="status" className="flex items-center gap-2 text-sm"><Spinner />Getting your share link…</p>
          ) : state.token && state.shortCode ? (
            <GuestPassShareDetails key={state.token} token={state.token} shortCode={state.shortCode} />
          ) : state.needsReplacement ? (
            <form action={action} className="flex flex-col gap-4">
              <input type="hidden" name="passId" value={passId} />
              <input type="hidden" name="replaceLink" value="true" />
              <p className="text-sm text-ink-soft">This older pass has no saved share link. Creating a replacement will stop its original QR, link and short code from working. Visit details and entries stay unchanged.</p>
              <Button type="submit">Create replacement link</Button>
            </form>
          ) : state.message ? (
            <Alert variant="destructive"><AlertDescription>{state.message}</AlertDescription></Alert>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
