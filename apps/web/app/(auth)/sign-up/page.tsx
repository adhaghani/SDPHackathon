import { SignUpForm } from "@/components/auth/sign-up-form"
import { authContent } from "@/content/auth"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-lg text-ink">
          {authContent.signUp.title}
        </h1>
        <p className="mt-2 text-ink-muted">
          {authContent.signUp.description}
        </p>
      </div>
      <SignUpForm inviteCode={params.invite} />
    </div>
  )
}
