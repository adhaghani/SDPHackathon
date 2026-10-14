import { SignInForm } from "@/components/auth/sign-in-form"
import { DemoRoleSwitcher } from "@/components/demo/demo-role-switcher"
import { authContent } from "@/content/auth"
import { isDemoMode } from "@/lib/env"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string }>
}) {
  const params = await searchParams
  const next =
    params.next?.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/home"

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl leading-tight font-extrabold tracking-[-0.03em] text-balance text-ink sm:text-[40px]">
          {authContent.signIn.title}
        </h1>
        <p className="mt-2 text-ink-muted">{authContent.signIn.description}</p>
      </div>
      {params.message ? (
        <Alert role="status">
          <AlertDescription>{params.message}</AlertDescription>
        </Alert>
      ) : null}
      <SignInForm next={next} />
      {isDemoMode() ? (
        <div className="flex flex-col gap-5">
          <Separator />
          <DemoRoleSwitcher />
        </div>
      ) : null}
    </div>
  )
}
