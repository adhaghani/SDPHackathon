import { BrandLogo } from "@/components/shared/brand-logo"
import { redirect } from "next/navigation"

import { JoinForm } from "@/components/onboarding/join-form"
import { PillarStrip } from "@/components/block/pillar-strip"
import { getSessionContext } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/navigation/sign-out-button"
import Link from "next/link"
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

  const supabase = await createClient()
  const { data: platformAdmin } = await supabase.rpc("is_platform_admin")
  if (platformAdmin) redirect("/superadmin")
  const unavailable = context.unavailableMemberships?.find(
    (m) => m.role === "township_admin" && m.status === "active"
  )
  if (unavailable)
    return (
      <main className="mx-auto flex min-h-svh max-w-xl flex-col items-start justify-center gap-5 px-6">
        <h1 className="font-display text-3xl font-bold">
          {unavailable.townships?.lifecycle === "draft"
            ? "Your township is being prepared"
            : "Your township is archived"}
        </h1>
        <p>
          Your manager appointment is saved. A superadmin needs to activate{" "}
          {unavailable.townships?.name} before you can open its dashboard.
        </p>
        <Link href="/admin" className="font-bold underline">
          Check township status
        </Link>
        <SignOutButton />
      </main>
    )

  return (
    <main className="min-h-svh bg-background">
      <div className="bb-safe-top rounded-b-[32px] bg-lime text-ink">
        <div className="mx-auto max-w-2xl px-4 pt-6 pb-9 sm:px-6">
          <BrandLogo />
          <p className="mt-8 text-tag text-ink-soft">
            Step 1 of 1 · Join your township
          </p>
          <h1 className="mt-2 font-display text-[32px] leading-tight font-extrabold text-balance text-ink sm:text-5xl">
            Start with your township&apos;s join code
          </h1>
          <p className="mt-3 max-w-[56ch] text-ink-soft">
            Your unit label stays private. It&apos;s used only to verify you
            live here, and is never shown to other residents, admins or
            sponsors.
          </p>
          <PillarStrip className="mt-8" />
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
        <div className="mt-7 rounded-[22px] bg-white p-5 sm:p-7">
          <JoinForm />
        </div>
      </div>
    </main>
  )
}
