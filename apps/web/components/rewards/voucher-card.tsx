"use client"

import { TicketIcon } from "lucide-react"
import { CopyCodeButton } from "@/components/rewards/copy-code-button"
import { formatEventDate } from "@/lib/format"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

export function VoucherCard({
  title,
  partnerName,
  code,
  costBp,
  redeemedAt,
  validUntil,
}: {
  title: string
  partnerName?: string | null
  code: string
  costBp: number
  redeemedAt: string
  validUntil?: string | null
}) {
  return (
    <li className="flex min-w-0 flex-col rounded-[20px] border border-hairline bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-ink-soft">{partnerName ?? "Township reward"}</p>
        <span className="rounded-full bg-lime px-2.5 py-1 font-bold text-ink">
          Ready to use
        </span>
      </div>
      <h3 className="mt-3 text-title text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">
        {validUntil
          ? `Valid until ${formatEventDate(validUntil)}`
          : "Show your code to the partner."}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Dialog>
          <DialogTrigger render={<Button variant="default" />}>
            <TicketIcon aria-hidden="true" />
            Show voucher
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="pr-8">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                Show this code to {partnerName ?? "the township partner"}. Each
                voucher can be used once.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-[16px] bg-paper p-5 text-center">
              <p className="mb-2 text-sm font-bold">Voucher code</p>
              <code className="block font-mono text-2xl font-bold tracking-wider break-all text-ink">
                {code}
              </code>
            </div>
            <div className="flex justify-center">
              <CopyCodeButton code={code} />
            </div>
            <dl className="grid gap-2 border-t border-hairline pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Redeemed</dt>
                <dd>{formatEventDate(redeemedAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Points used</dt>
                <dd>{costBp.toLocaleString("en-MY")} BP</dd>
              </div>
              {validUntil ? (
                <div className="flex justify-between gap-3">
                  <dt>Valid until</dt>
                  <dd>{formatEventDate(validUntil)}</dd>
                </div>
              ) : null}
            </dl>
          </DialogContent>
        </Dialog>
        <CopyCodeButton code={code} />
      </div>
    </li>
  )
}
