"use client"

import { useActionState } from "react"

import { addWishlistAction } from "@/actions/demand"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
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

export function WishlistForm({
  categorySlug,
  normalizedTerm,
  initialLabel,
}: {
  categorySlug: string
  normalizedTerm: string
  initialLabel: string
}) {
  const [state, action, pending] = useActionState(addWishlistAction, idleState)
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="mt-2" />}
      >
        Add to wishlist
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Add to shared library wishlist</DialogTitle>
          <DialogDescription>
            Give this item a clear label for the township office to review.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="categorySlug" value={categorySlug} />
          <input type="hidden" name="normalizedTerm" value={normalizedTerm} />
          <Field>
            <FieldLabel htmlFor={`wishlist-${normalizedTerm}`}>
              Shared library label
            </FieldLabel>
            <Input
              id={`wishlist-${normalizedTerm}`}
              name="label"
              defaultValue={initialLabel}
              maxLength={160}
              required
            />
          </Field>
          {state.message ? (
            <Alert
              variant={state.status === "error" ? "destructive" : "default"}
            >
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Add to shared library wishlist
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
