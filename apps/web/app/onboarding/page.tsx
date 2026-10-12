import { redirect } from "next/navigation"

import { JoinForm } from "@/components/onboarding/join-form"
import { getSessionContext } from "@/lib/data"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; joined?: string }>
}) {
  const params = await searchParams
  const context = await getSessionContext()

  if (!context.user) {
    redirect("/sign-in?next=/onboarding")
  }

  if (context.membership?.status === "active") {
    redirect("/home")
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="bb-band bb-safe-top rounded-b-[28px]">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <p className="text-[13px] font-bold text-band-eyebrow">Join your township</p>
          <h1 className="mt-1 font-display text-3xl text-white">
            Start with a verified join code
          </h1>
          <p className="mt-2 text-band-eyebrow">
            BorrowBetter keeps your unit label private and only uses it for
            township verification.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {context.membership?.status === "pending" ? (
          <Alert className="mt-0">
            <AlertDescription>
              Your request is waiting for township approval. You can check the
              code again below or return later.
            </AlertDescription>
          </Alert>
        ) : null}
        {params.error ? (
          <Alert variant="destructive" className="mt-0">
            <AlertDescription>
              {params.error === "check_fields"
                ? "Check the highlighted fields."
                : "We could not complete membership. Check the code and try again."}
            </AlertDescription>
          </Alert>
        ) : null}
        {params.joined ? (
          <Alert className="mt-0">
            <AlertDescription>
              You joined the demo township. Your active route is ready.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="bb-card mt-7 p-5 sm:p-7">
          <JoinForm />
        </div>
      </div>
    </main>
  )
}
