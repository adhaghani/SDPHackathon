"use client"

import { useActionState } from "react"
import { appointManager, revokeManager } from "@/actions/platform"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@workspace/ui/components/alert-dialog"
import type { Database } from "@/types/database"

type Invitation =
  Database["public"]["Tables"]["platform_manager_invitations"]["Row"]

export function ManagerPanel({
  townshipId,
  invitations,
  archived,
}: {
  townshipId: string
  invitations: Invitation[]
  archived: boolean
}) {
  const [state, action, pending] = useActionState(appointManager, {
    status: "idle",
  })
  return (
    <section aria-labelledby="managers-heading" className="flex flex-col gap-5">
      <div>
        <h2 id="managers-heading" className="font-display text-2xl font-bold">
          Township managers
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          Appoint an existing verified account, or send a new manager a secure
          email invitation. Appoint a replacement before removing the last
          active manager.
        </p>
      </div>
      <ul className="divide-y divide-hairline border-y border-hairline">
        {invitations.map((i) => (
          <li
            key={i.id}
            className="flex flex-wrap items-start justify-between gap-4 py-4"
          >
            <div className="min-w-0">
              <p className="font-bold">{i.display_name}</p>
              <p className="text-sm break-all text-ink-muted">{i.email}</p>
              <p className="mt-2 text-sm font-bold">
                {i.status === "accepted"
                  ? "Active manager"
                  : i.status === "sent"
                    ? "Invitation sent · awaiting acceptance"
                    : i.status === "failed"
                      ? "Email delivery failed"
                      : i.status === "revoked"
                        ? "Access revoked"
                        : "Awaiting email delivery"}
              </p>
              {i.last_error ? (
                <p className="mt-1 text-sm text-destructive">{i.last_error}</p>
              ) : null}
            </div>
            {!archived && i.status !== "revoked" ? (
              <ManagerActions invitation={i} />
            ) : null}
          </li>
        ))}
      </ul>
      {!invitations.length ? (
        <p className="text-sm text-ink-muted">No managers appointed yet.</p>
      ) : null}
      {!archived ? (
        <form action={action} className="grid items-end gap-4 sm:grid-cols-2">
          <input type="hidden" name="townshipId" value={townshipId} />
          <Field>
            <FieldLabel htmlFor="manager-name">Manager’s full name</FieldLabel>
            <Input
              id="manager-name"
              name="displayName"
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="manager-email">Email address</FieldLabel>
            <Input
              id="manager-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="cta" disabled={pending}>
              {pending ? "Appointing…" : "Appoint manager"}
            </Button>
          </div>
          {state.message ? (
            <p role="status" className="text-sm sm:col-span-2">
              {state.message}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="text-sm text-ink-muted">
          Restore this township before appointing managers.
        </p>
      )}
    </section>
  )
}

function ManagerActions({ invitation }: { invitation: Invitation }) {
  const [resendState, resend, resending] = useActionState(appointManager, {
    status: "idle",
  })
  const [revokeState, revoke, revoking] = useActionState(revokeManager, {
    status: "idle",
  })
  return (
    <div className="flex max-w-sm flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {invitation.status !== "accepted" ? (
          <form action={resend}>
            <input
              type="hidden"
              name="townshipId"
              value={invitation.township_id}
            />
            <input
              type="hidden"
              name="displayName"
              value={invitation.display_name}
            />
            <input type="hidden" name="email" value={invitation.email} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={resending || revoking}
            >
              {resending ? "Sending…" : "Resend invitation"}
            </Button>
          </form>
        ) : null}
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resending || revoking}
              >
                {invitation.status === "accepted"
                  ? "Remove manager"
                  : "Revoke invitation"}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke this appointment?</AlertDialogTitle>
              <AlertDialogDescription>
                {invitation.display_name} will lose manager access to this
                township. Their account and existing resident records will
                remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form action={revoke}>
              <input type="hidden" name="invitationId" value={invitation.id} />
              <AlertDialogFooter>
                <AlertDialogCancel>Keep appointment</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={revoking}>
                  Revoke appointment
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {resendState.message || revokeState.message ? (
        <p role="status" className="text-sm">
          {resendState.message || revokeState.message}
        </p>
      ) : null}
    </div>
  )
}
