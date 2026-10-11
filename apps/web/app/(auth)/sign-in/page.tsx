import { SignInForm } from "@/components/auth/sign-in-form"
import { authContent } from "@/content/auth"

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
        <h1 className="font-heading text-3xl font-semibold">
          {authContent.signIn.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {authContent.signIn.description}
        </p>
      </div>
      {params.message ? (
        <p className="rounded-lg border border-line-impact/40 bg-line-impact/10 p-3 text-sm">
          {params.message}
        </p>
      ) : null}
      <SignInForm next={next} />
    </div>
  )
}
