"use client"

import { useState, useTransition } from "react"
import { CheckIcon, XIcon } from "lucide-react"

import { respondWalkIn } from "@/actions/guest-guard"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

export type PendingWalkIn = {
  id: string
  visitor_name: string
  vehicle_plate?: string | null
  requested_at: string
  gate_name?: string
}

export function WalkInApprovals({ requests }: { requests: PendingWalkIn[] }) {
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function respond(requestId: string, approve: boolean) {
    startTransition(async () => {
      const result = await respondWalkIn({ requestId, approve: approve ? "true" : "false" })
      setMessage(result.message ?? null)
    })
  }

  if (!requests.length) return null

  return (
    <section className="rounded-[22px] bg-sky p-5 text-ink" aria-labelledby="walkin-approval-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="walkin-approval-heading" className="text-h2">Waiting at the gate</h2>
          <p className="mt-1 text-body text-ink-soft">Approve or deny within the township timeout.</p>
        </div>
        {message ? <p className="text-sm font-semibold">{message}</p> : null}
      </div>
      <ul className="mt-4 flex flex-col gap-3">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-white p-4">
            <div>
              <p className="text-[17px] leading-[21px] font-bold">{request.visitor_name}</p>
              <p className="mt-1 text-sm text-ink-soft">{request.gate_name ?? "Gate"} · {request.vehicle_plate || "No plate"} · {new Intl.DateTimeFormat("en-MY", { timeStyle: "short" }).format(new Date(request.requested_at))}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="cta" size="sm" disabled={pending} onClick={() => respond(request.id, true)}>
                {pending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                Approve
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => respond(request.id, false)}>
                <XIcon data-icon="inline-start" />
                Deny
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {message ? <Alert className="mt-3"><AlertDescription>{message}</AlertDescription></Alert> : null}
    </section>
  )
}
