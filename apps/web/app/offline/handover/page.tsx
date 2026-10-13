import Link from "next/link"
import { OfflineHandoverSync } from "@/components/borrow/offline-handover-sync"

export default function OfflineHandoverPage() {
  return (
    <main className="min-h-svh bg-paper px-4 py-6 text-ink sm:px-8">
      <div className="mx-auto max-w-xl rounded-[32px] bg-white p-5 sm:p-8">
        <p className="text-tag text-ink-soft">BorrowLah · Offline</p>
        <h1 className="mt-4 font-display text-h1 text-balance">Handover page available offline</h1>
        <p className="mt-4 text-body text-ink-soft">
          You can scan or paste a handover QR once this booking page has loaded once online. Scans are saved on this device and synchronize when the connection returns.
        </p>
        <div className="mt-6 rounded-[20px] bg-paper p-4 text-sm text-ink">
          <p className="font-bold">No connection right now</p>
          <p className="mt-1 text-ink-soft">Tokens are checked again on the server before a handover is recorded. Expired or replayed codes are rejected.</p>
        </div>
        <OfflineHandoverSync />
        <Link
          href="/borrow/mine"
          className="mt-7 inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-bold text-white"
        >
          Back to your loans
        </Link>
      </div>
    </main>
  )
}
