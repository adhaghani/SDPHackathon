"use client"

import Image from "next/image"
import { BookOpenIcon, PencilIcon } from "lucide-react"

import { ItemGuideForm } from "@/components/borrow/item-guide-form"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

type Guide = {
  body: string
  safety_note?: string | null
  photo_paths?: string[] | null
}

export function ItemGuideDialog({
  itemId,
  guide,
  isOwner,
}: {
  itemId: string
  guide: Guide | null
  isOwner: boolean
}) {
  const photos = guide?.photo_paths ?? []

  return (
    <Dialog>
      <DialogTrigger
        render={<Button type="button" variant={guide ? "outline" : "cta"} />}
      >
        {isOwner ? (
          <PencilIcon data-icon="inline-start" />
        ) : (
          <BookOpenIcon data-icon="inline-start" />
        )}
        {guide
          ? isOwner
            ? "Edit how-to guide"
            : "View how-to guide"
          : "Add how-to guide"}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {isOwner
              ? guide
                ? "Edit how-to guide"
                : "Add a how-to guide"
              : "How to use this item"}
          </DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Give borrowers clear operating steps and any important safety information."
              : "Instructions provided by the item owner."}
          </DialogDescription>
        </DialogHeader>

        {isOwner ? (
          <ItemGuideForm
            itemId={itemId}
            initialBody={guide?.body ?? ""}
            initialSafetyNote={guide?.safety_note ?? ""}
            initialPhotoPaths={photos}
          />
        ) : guide ? (
          <div className="flex flex-col gap-5">
            <p className="max-w-[70ch] text-[15px] leading-6 whitespace-pre-line">
              {guide.body}
            </p>
            {photos.length ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {photos.map((src, index) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-paper"
                  >
                    <Image
                      unoptimized
                      src={src}
                      alt={`How-to guide photo ${index + 1}`}
                      fill
                      sizes="(min-width: 640px) 12rem, 100vw"
                      className="object-contain"
                    />
                  </a>
                ))}
              </div>
            ) : null}
            {guide.safety_note ? (
              <div className="rounded-xl bg-tomato p-4 text-sm text-ink">
                <strong>Safety:</strong> {guide.safety_note}
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
