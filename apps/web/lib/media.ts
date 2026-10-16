type PrepareImageOptions = {
  maxDimension?: number
  quality?: number
  mimeType?: "image/webp" | "image/jpeg" | "image/png"
}

export type CropImageOptions = {
  width: number
  height: number
  zoom?: number
  positionX?: number
  positionY?: number
  rotation?: 0 | 90 | 180 | 270
  quality?: number
}

export async function cropImageForUpload(
  file: File,
  {
    width,
    height,
    zoom = 1,
    positionX = 0,
    positionY = 0,
    rotation = 0,
    quality = 0.86,
  }: CropImageOptions
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const rotated = document.createElement("canvas")
    const swapsSides = rotation === 90 || rotation === 270
    rotated.width = swapsSides ? bitmap.height : bitmap.width
    rotated.height = swapsSides ? bitmap.width : bitmap.height
    const rotatedContext = rotated.getContext("2d")
    if (!rotatedContext) throw new Error("image_canvas_unavailable")

    rotatedContext.translate(rotated.width / 2, rotated.height / 2)
    rotatedContext.rotate((rotation * Math.PI) / 180)
    rotatedContext.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)

    const safeZoom = Math.max(1, Math.min(3, zoom))
    const sourceAspect = rotated.width / rotated.height
    const targetAspect = width / height
    let cropWidth = rotated.width
    let cropHeight = rotated.height
    if (sourceAspect > targetAspect) cropWidth = cropHeight * targetAspect
    else cropHeight = cropWidth / targetAspect
    cropWidth /= safeZoom
    cropHeight /= safeZoom

    const maxX = Math.max(0, rotated.width - cropWidth)
    const maxY = Math.max(0, rotated.height - cropHeight)
    const normalizedX = Math.max(-1, Math.min(1, positionX))
    const normalizedY = Math.max(-1, Math.min(1, positionY))
    const sourceX = (maxX / 2) * (normalizedX + 1)
    const sourceY = (maxY / 2) * (normalizedY + 1)

    const output = document.createElement("canvas")
    output.width = width
    output.height = height
    const context = output.getContext("2d")
    if (!context) throw new Error("image_canvas_unavailable")
    context.drawImage(
      rotated,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      width,
      height
    )

    const blob = await new Promise<Blob | null>((resolve) => {
      output.toBlob(resolve, "image/webp", quality)
    })
    if (!blob) throw new Error("image_encode_failed")
    return blob
  } finally {
    bitmap.close()
  }
}

/**
 * Re-encodes an image through canvas before upload. A newly encoded blob does
 * not inherit EXIF metadata, including GPS coordinates from the source file.
 */
export async function prepareImageForUpload(
  file: File,
  {
    maxDimension = 1600,
    quality = 0.82,
    mimeType = "image/webp",
  }: PrepareImageOptions = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height)
    )
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
