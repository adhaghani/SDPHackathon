"use client"

import { useEffect, useState } from "react"
import { RotateCcwIcon } from "lucide-react"

import { cropImageForUpload } from "@/lib/media"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from "@workspace/ui/components/kibo-ui/image-crop/index"
import { Spinner } from "@workspace/ui/components/spinner"

export function PublicImageCropDialog({
  file,
  title,
  aspectLabel,
  outputWidth,
  outputHeight,
  onCancel,
  onConfirm,
}: {
  file: File | null
  title: string
  aspectLabel: string
  outputWidth: number
  outputHeight: number
  onCancel: () => void
  onConfirm: (blob: Blob, sourceFile: File) => Promise<void>
}) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (file) setError(null)
  }, [file])

  async function useCrop(croppedImage: string) {
    if (!file) return
    setProcessing(true)
    setError(null)
    try {
      const response = await fetch(croppedImage)
      const croppedBlob = await response.blob()
      const croppedFile = new File([croppedBlob], file.name, {
        type: croppedBlob.type,
      })
      const uploadBlob = await cropImageForUpload(croppedFile, {
        width: outputWidth,
        height: outputHeight,
      })
      await onConfirm(uploadBlob, file)
    } catch {
      setError(
        "The crop could not be prepared. Try another image or reset the crop."
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog
      open={Boolean(file)}
      onOpenChange={(open) => !open && !processing && onCancel()}
    >
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="px-5 pt-5 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Drag and resize the crop frame to choose the visible area. The
            photo will be saved at {aspectLabel}.
          </DialogDescription>
        </DialogHeader>

        {file ? (
          <ImageCrop
            key={`${file.name}-${file.lastModified}`}
            file={file}
            aspect={outputWidth / outputHeight}
            keepSelection
            onCrop={(croppedImage) => void useCrop(croppedImage)}
          >
            <div className="flex flex-col gap-5 px-5">
              <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-muted p-3 sm:min-h-96">
                <ImageCropContent className="max-h-[min(60svh,32rem)] max-w-full" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Only the area inside the frame will be uploaded.
                </p>
                <ImageCropReset asChild>
                  <Button type="button" variant="ghost" disabled={processing}>
                    <RotateCcwIcon data-icon="inline-start" />
                    Reset
                  </Button>
                </ImageCropReset>
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={processing}
                onClick={onCancel}
              >
                Cancel
              </Button>
              <ImageCropApply asChild>
                <Button type="button" variant="cta" disabled={processing}>
                  {processing ? <Spinner data-icon="inline-start" /> : null}
                  Use this crop
                </Button>
              </ImageCropApply>
            </DialogFooter>
          </ImageCrop>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
