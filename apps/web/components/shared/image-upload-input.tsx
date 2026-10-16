"use client"

import { ImagePlusIcon } from "lucide-react"

import { buttonVariants } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

export function ImageUploadInput({
  id,
  disabled = false,
  multiple = false,
  hasImage = false,
  onFiles,
}: {
  id: string
  disabled?: boolean
  multiple?: boolean
  hasImage?: boolean
  onFiles: (files: File[]) => void
}) {
  return (
    <div>
      <Input
        id={id}
        type="file"
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const files = event.target.files ? Array.from(event.target.files) : []
          event.target.value = ""
          onFiles(files)
        }}
      />
      <label
        htmlFor={disabled ? undefined : id}
        aria-disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-fit",
          disabled &&
            "pointer-events-none border-transparent bg-hairline text-ink-muted"
        )}
      >
        <ImagePlusIcon aria-hidden="true" data-icon="inline-start" />
        {multiple
          ? hasImage
            ? "Add more photos"
            : "Choose photos"
          : hasImage
            ? "Replace photo"
            : "Choose photo"}
      </label>
    </div>
  )
}
