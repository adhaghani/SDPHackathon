type PrepareImageOptions = {
  maxDimension?: number
  quality?: number
  mimeType?: "image/webp" | "image/jpeg" | "image/png"
}

/**
 * Re-encodes an image through canvas before upload. A newly encoded blob does
 * not inherit EXIF metadata, including GPS coordinates from the source file.
 */
export async function prepareImageForUpload(
  file: File,
  { maxDimension = 1600, quality = 0.82, mimeType = "image/webp" }: PrepareImageOptions = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))

    const context = canvas.getContext("2d")
    if (!context) throw new Error("image_canvas_unavailable")
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, quality)
    })
    if (!blob) throw new Error("image_encode_failed")
    return blob
  } finally {
    bitmap.close()
  }
}
