import { SignInForm } from "@/components/auth/sign-in-form"
import { DemoRoleSwitcher } from "@/components/demo/demo-role-switcher"
import { authContent } from "@/content/auth"
import { isDemoMode } from "@/lib/env"

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
        <h1 className="font-display text-3xl">
          {authContent.signIn.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {authContent.signIn.description}
        </p>
      </div>
      {params.message ? (
        <p className="rounded-lg border border-mint-tint bg-mint-tint p-3 text-sm font-bold text-ink">
          {params.message}
        </p>
      ) : null}
      <SignInForm next={next} />
      {isDemoMode() ? (
        <div className="border-t border-border pt-5">
          <DemoRoleSwitcher />
        </div>
      ) : null}
    </div>
  )
}
