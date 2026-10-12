"use client"

import { useActionState } from "react"
import { FlagIcon } from "lucide-react"

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
    <details className="group">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-bold text-ink-muted transition-colors duration-150 ease-out hover:text-ink [&::-webkit-details-marker]:hidden">
        <FlagIcon aria-hidden="true" className="size-4" />
        Report this {targetType.replace("_", " ")}
      </summary>
      <form action={action} className="mt-2 flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4">
        <input type="hidden" name="townshipId" value={townshipId} />
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <Field>
          <FieldLabel htmlFor={`report-reason-${targetId}`}>Reason</FieldLabel>
          <select id={`report-reason-${targetId}`} name="reason" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
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
