"use client"

import { useActionState } from "react"
import { FlagIcon } from "lucide-react"

import { submitReport } from "@/actions/reports"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"
import { Spinner } from "@workspace/ui/components/spinner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

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
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" variant="ghost" className="text-ink-muted" />
        }
      >
        <FlagIcon aria-hidden="true" className="size-4" />
        Report this {targetType.replace("_", " ")}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Report this {targetType.replace("_", " ")}</DialogTitle>
          <DialogDescription>
            Tell the township team what needs their attention.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="townshipId" value={townshipId} />
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <Field>
            <FieldLabel htmlFor={`report-reason-${targetId}`}>
              Reason
            </FieldLabel>
            <select
              id={`report-reason-${targetId}`}
              name="reason"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="safety">Safety concern</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="spam">Spam</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor={`report-details-${targetId}`}>
              Details
            </FieldLabel>
            <Textarea
              id={`report-details-${targetId}`}
              name="details"
              rows={3}
            />
          </Field>
          <Button
            type="submit"
            variant="outline"
            className="h-11"
            disabled={pending}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Submit report
          </Button>
          {state.message ? (
            <Alert
              variant={state.status === "error" ? "destructive" : "default"}
            >
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
        </form>
      </DialogContent>
    </Dialog>
  )
}
