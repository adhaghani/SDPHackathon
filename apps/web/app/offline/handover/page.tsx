import Link from "next/link"
import { OfflineHandoverSync } from "@/components/borrow/offline-handover-sync"

export default function OfflineHandoverPage() {
  return (
    <main className="bb-on-ink min-h-svh bg-ink px-5 py-8 text-surface sm:px-8">
      <div className="mx-auto max-w-xl">
        <p className="text-eyebrow text-band-eyebrow">BorrowBetter · Offline</p>
        <h1 className="mt-4 font-display text-4xl leading-tight font-bold">Handover page available offline</h1>
        <p className="mt-4 text-band-eyebrow">
          You can scan or paste a handover QR once this booking page has loaded once online. Scans are saved on this device and synchronize when the connection returns.
        </p>
        <div className="mt-6 rounded-lg bg-white/[0.08] p-4 text-sm text-surface">
          <p className="font-bold">No connection right now</p>
          <p className="mt-1 text-band-eyebrow">Tokens are checked again on the server before a handover is recorded. Expired or replayed codes are rejected.</p>
        </div>
        <OfflineHandoverSync />
        <Link
          href="/borrow/mine"
          className="mt-7 inline-flex min-h-12 items-center rounded-full bg-surface px-6 font-bold text-ink"
        >
          Back to your loans
        </Link>
      </div>
    </main>
  )
}
