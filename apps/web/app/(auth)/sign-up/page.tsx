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
        <h1 className="font-display text-4xl leading-tight font-extrabold tracking-[-0.03em] text-balance text-ink sm:text-[40px]">
          {authContent.signUp.title}
        </h1>
        <p className="mt-2 text-ink-muted">{authContent.signUp.description}</p>
      </div>
      <SignUpForm inviteCode={params.invite} />
    </div>
  )
}
