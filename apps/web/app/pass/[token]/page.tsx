import { notFound } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { ShieldCheckIcon } from "lucide-react"

import { resolveGuestPass } from "@/actions/guest-pass"
import { getAppUrl } from "@/lib/env"
import { PillarStrip } from "@/components/block/pillar-strip"

type PassResult = {
  valid: boolean
  reason?: string
  data?: {
    pass_id?: string
    visitor_name?: string
    valid_from?: string
    valid_until?: string
    status?: "active" | "revoked" | "expired" | "completed"
    township_name?: string
    gates?: Array<{ id: string; name: string }>
    privacy_retention_days?: number
  }
}

function formatDate(value?: string): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value))
}

export default async function PublicGuestPassPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  if (!token || token.length > 256) notFound()

  const result = (await resolveGuestPass(token)) as PassResult
  const pass = result.valid ? result.data : undefined

  if (!pass) {
    return (
      <main className="min-h-svh bg-paper px-5 py-8 text-ink">
        <div className="mx-auto max-w-md rounded-[28px] bg-white p-6 shadow-none">
          <PillarStrip compact />
          <h1 className="text-h1 mt-5">Pass unavailable</h1>
          <p className="mt-3 text-body text-ink-soft">
            This guest pass is invalid, revoked or expired. Ask the resident for a new pass.
          </p>
        </div>
      </main>
    )
  }

  const shareUrl = `${getAppUrl()}/pass/${token}`
  const inactive = pass.status !== "active"

  return (
    <main className="min-h-svh bg-lime px-5 py-8 text-ink">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <PillarStrip />
        <section className="rounded-[28px] bg-white p-6">
          <p className="text-tag text-ink-soft">Guest access · {pass.township_name}</p>
          <h1 className="text-h1 mt-2">{pass.visitor_name}</h1>
          <p className="mt-2 text-body text-ink-soft">{formatDate(pass.valid_from)} – {formatDate(pass.valid_until)}</p>

          {!inactive ? (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="rounded-[22px] bg-white p-3 ring-2 ring-ink">
                <QRCodeSVG value={shareUrl} size={248} level="M" title="Guest access QR code" bgColor="#ffffff" fgColor="#111111" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Show this QR at the gate</p>
            </div>
          ) : (
            <div className="mt-6 rounded-[20px] bg-tomato p-4 text-ink">
              <p className="font-bold">{pass.status === "revoked" ? "This pass has been revoked." : pass.status === "expired" ? "This pass has expired." : "This pass is complete."}</p>
              <p className="mt-1 text-sm">Ask the resident to create a new pass.</p>
            </div>
          )}

          <div className="mt-6 rounded-[20px] bg-paper p-4">
            <p className="font-bold">Available gates</p>
            <p className="mt-1 text-sm text-ink-soft">
              {(pass.gates ?? []).map((gate) => gate.name).join(" · ") || "Ask the guard which gate to use."}
            </p>
          </div>

          <div className="mt-5 flex gap-3 border-t border-hairline pt-5 text-sm text-ink-soft">
            <ShieldCheckIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink" />
            <p>
              Entry and exit times, gate, ID-sighted confirmation and notes are logged for access control. Personal data is deleted after {pass.privacy_retention_days ?? 90} days.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
