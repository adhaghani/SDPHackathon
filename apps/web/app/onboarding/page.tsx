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
    <main className="min-h-svh bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-medium text-rimba-ink">Join your township</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold">
          Start with a verified join code
        </h1>
        <p className="mt-2 text-muted-foreground">
          BorrowBetter keeps your unit label private and only uses it for
          township verification.
        </p>
        {context.membership?.status === "pending" ? (
          <Alert className="mt-6">
            <AlertDescription>
              Your request is waiting for township approval. You can check the
              code again below or return later.
            </AlertDescription>
          </Alert>
        ) : null}
        {params.error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>
              {params.error === "check_fields"
                ? "Check the highlighted fields."
                : "We could not complete membership. Check the code and try again."}
            </AlertDescription>
          </Alert>
        ) : null}
        {params.joined ? (
          <Alert className="mt-6">
            <AlertDescription>
              You joined the demo township. Your active route is ready.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-7">
          <JoinForm />
        </div>
      </div>
    </main>
  )
}
