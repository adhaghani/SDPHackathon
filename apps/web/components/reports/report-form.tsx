"use client"

import { useActionState } from "react"

import { submitReport } from "@/actions/reports"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { Spinner } from "@workspace/ui/components/spinner"

const idleState = { status: "idle" } as const

export function ReportForm({
  townshipId,
  targetType,
  targetId,
}: {
  townshipId: string
  targetType: "item" | "event" | "help_request" | "message" | "profile"
  targetId: string
}) {
  const [state, action, pending] = useActionState(submitReport, idleState)

  return (
    <details className="mt-4 rounded-lg border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Report this {targetType.replace("_", " ")}</summary>
      <form action={action} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="townshipId" value={townshipId} />
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <Field>
          <FieldLabel htmlFor={`report-reason-${targetId}`}>Reason</FieldLabel>
          <select id={`report-reason-${targetId}`} name="reason" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="safety">Safety concern</option>
            <option value="inappropriate">Inappropriate content</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`report-details-${targetId}`}>Details</FieldLabel>
          <Textarea id={`report-details-${targetId}`} name="details" rows={3} />
        </Field>
        <Button type="submit" variant="outline" className="h-11" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Submit report
        </Button>
        {state.message ? <Alert variant={state.status === "error" ? "destructive" : "default"}><AlertDescription>{state.message}</AlertDescription></Alert> : null}
      </form>
    </details>
  )
}
