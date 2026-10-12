import { SignUpForm } from "@/components/auth/sign-up-form"
import { authContent } from "@/content/auth"

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl">
          {authContent.signUp.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {authContent.signUp.description}
        </p>
      </div>
      <SignUpForm />
    </div>
  )
}
