"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { ItemRequestForm } from "@/components/borrow/item-request-form"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

export function ItemRequestDialog({
  categories,
  initialTitle = "",
}: {
  categories: Array<{ slug: string; name: string; kind: string }>
  initialTitle?: string
}) {
  const [open, setOpen] = useState(Boolean(initialTitle))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="cta" size="cta" />}>
        <PlusIcon data-icon="inline-start" />
        Post a request
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Post a request</DialogTitle>
          <DialogDescription>
            Tell nearby neighbours what you need. Matching owners and category
            followers will be notified.
          </DialogDescription>
        </DialogHeader>
        <ItemRequestForm
          categories={categories}
          initialTitle={initialTitle}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
