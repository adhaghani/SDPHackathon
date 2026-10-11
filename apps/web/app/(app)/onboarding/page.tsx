import { KeyRoundIcon } from "lucide-react"

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <KeyRoundIcon aria-hidden="true" className="size-7 text-line-borrow" />
      <h1 className="mt-4 font-heading text-3xl font-semibold">
        Join your township
      </h1>
      <p className="mt-2 text-muted-foreground">
        Enter the join code provided by your township office. Membership
        verification and profile setup arrive in Phase 1.
      </p>
      <div className="mt-7 border-y border-border py-5">
        <p className="font-medium">Foundation complete</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account is ready. The next step will verify where you live
          without showing your unit label to other residents.
        </p>
      </div>
    </div>
  )
}
