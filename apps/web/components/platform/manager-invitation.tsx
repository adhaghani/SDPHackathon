"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { acceptManager } from "@/actions/platform"
import { getBrowserClient } from "@/lib/supabase/browser"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Field, FieldLabel } from "@workspace/ui/components/field"

export function ManagerInvitation() {
  const [state, action, pending] = useActionState(acceptManager, {
    status: "idle",
  })
  const [townships, setTownships] = useState<{ name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const confirmation = useRef<Promise<{ name: string }[]> | null>(null)
  useEffect(() => {
    let cancelled = false
    async function load() {
      const fragment = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = fragment.get("access_token")
      const refreshToken = fragment.get("refresh_token")
      const code = new URLSearchParams(window.location.search).get("code")
      if (fragment.size || code)
        window.history.replaceState(null, "", window.location.pathname)
      const supabase = getBrowserClient()
      if (fragment.has("error"))
        throw new Error(
          "This link has expired. Ask your superadmin to resend the invitation."
        )
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error)
          throw new Error(
            "This link has expired. Ask your superadmin for another invitation."
          )
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error)
          throw new Error(
            "This link could not be confirmed. Ask your superadmin for another invitation."
          )
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user)
        throw new Error(
          "Open the invitation link in your email, or sign in with the invited account."
        )
      const { data, error } = await supabase.rpc("my_manager_invitations")
      if (error || !Array.isArray(data) || !data.length)
        throw new Error(
          "No pending appointment was found. It may already be accepted, revoked, or assigned to another email address."
        )
      return data as { name: string }[]
    }
    // Share the one-time token exchange across React Strict Mode effect replay.
    confirmation.current ??= load()
    confirmation.current
      .then((value) => {
        if (!cancelled) setTownships(value)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof Error
              ? e.message
              : "Your invitation could not load. Please try again."
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-extrabold">
        Your community starts here.
      </h1>
      {loading ? (
        <p role="status">Confirming your manager invitation…</p>
      ) : error ? (
        <div className="flex flex-col gap-4">
          <p role="alert">{error}</p>
          <Link
            href="/sign-in?next=/manager-invitation"
            className="font-bold underline"
          >
            Sign in with your invited account
          </Link>
          <Link href="/home" className="text-sm underline">
            Go to BorrowLah
          </Link>
        </div>
      ) : (
        <>
          <p>
            You’ve been invited to manage{" "}
            {townships.map((t) => t.name).join(", ")}. Choose a password to
            accept your appointment.
          </p>
          <form action={action} className="flex flex-col gap-5">
            <PasswordField
              id="manager-password"
              autoComplete="new-password"
              description="Use 12–128 characters."
            />
            <Field>
              <FieldLabel htmlFor="confirm-manager-password">
                Confirm password
              </FieldLabel>
              <Input
                id="confirm-manager-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </Field>
            <div className="flex items-start gap-3">
              <Checkbox id="manager-terms" name="acceptedTerms" required />
              <label htmlFor="manager-terms" className="text-sm leading-6">
                I accept the{" "}
                <Link href="/terms" className="underline">
                  terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  privacy policy
                </Link>
                .
              </label>
            </div>
            {state.message ? (
              <p role="alert" className="text-sm">
                {state.message}
              </p>
            ) : null}
            <Button type="submit" variant="cta" disabled={pending}>
              {pending ? "Accepting…" : "Accept manager appointment"}
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
