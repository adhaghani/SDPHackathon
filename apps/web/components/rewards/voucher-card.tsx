"use client"

import { CalendarDaysIcon, CheckCircle2Icon, TicketIcon } from "lucide-react"
import { CopyCodeButton } from "@/components/rewards/copy-code-button"
import { formatEventDate } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Separator } from "@workspace/ui/components/separator"

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
    <li className="flex min-w-0 flex-col gap-4 rounded-[20px] border border-hairline bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-lime text-ink">
          <TicketIcon aria-hidden="true" className="size-5" />
        </div>
        <Badge>
          <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
          Ready to use
        </Badge>
      </div>
      <div className="min-w-0">
        <h3 className="text-xl leading-snug font-extrabold [overflow-wrap:anywhere] text-ink">
          {title}
        </h3>
        <p className="mt-1 text-sm [overflow-wrap:anywhere] text-ink-soft">
          {partnerName ?? "Township reward"}
        </p>
      </div>
      <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-soft">
        {validUntil ? (
          <CalendarDaysIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
        ) : null}
        {validUntil
          ? `Use by ${formatEventDate(validUntil)}`
          : "Show your voucher code to the partner."}
      </p>
      <div className="mt-auto flex flex-col gap-4">
        <Separator />
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger
              render={<Button variant="default" className="flex-1" />}
            >
              <TicketIcon aria-hidden="true" data-icon="inline-start" />
              Show voucher
            </DialogTrigger>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
              <DialogHeader className="shrink-0 gap-2 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pr-14">
                <DialogTitle>Ready to use</DialogTitle>
                <DialogDescription>
                  Show this voucher to {partnerName ?? "the township partner"}.
                  Each code can be used once.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
                <h3 className="text-xl leading-snug font-bold text-balance [overflow-wrap:anywhere]">
                  {title}
                </h3>
                <div className="my-5 rounded-2xl bg-lime px-4 py-5 text-center text-ink">
                  <p className="mb-2 text-sm font-semibold">
                    Your voucher code
                  </p>
                  <code className="block font-mono text-3xl leading-relaxed font-bold tracking-wider break-all select-all">
                    {code}
                  </code>
                  <p className="mt-2 text-xs">
                    Present this code when you use your reward.
                  </p>
                </div>
                <dl className="grid gap-3 text-sm">
                  {validUntil ? (
                    <div className="grid grid-cols-[1fr_1fr] items-start gap-3">
                      <dt className="text-muted-foreground">Use by</dt>
                      <dd className="text-right font-semibold">
                        {formatEventDate(validUntil)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-[1fr_1fr] items-start gap-3">
                    <dt className="text-muted-foreground">Redeemed on</dt>
                    <dd className="text-right">
                      {formatEventDate(redeemedAt)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr] items-start gap-3">
                    <dt className="text-muted-foreground">Points used</dt>
                    <dd className="text-right tabular-nums">
                      {costBp.toLocaleString("en-MY")} BP
                    </dd>
                  </div>
                </dl>
              </div>
              <DialogFooter className="mx-0 mb-0 shrink-0 flex-row flex-wrap items-start justify-between gap-2 px-5 py-3 sm:justify-between sm:px-6">
                <CopyCodeButton code={code} />
                <DialogClose render={<Button variant="default" />}>
                  Done
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <CopyCodeButton code={code} />
        </div>
      </div>
    </li>
  )
}
