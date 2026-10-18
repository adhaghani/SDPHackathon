import Image, { type ImageProps } from "next/image"
import { canOptimizeImage } from "@/lib/image-source"

export function PublicImage({ src, unoptimized, ...props }: ImageProps) {
  return (
    <Image
      {...props}
      src={src}
      unoptimized={
        unoptimized ?? (typeof src === "string" && !canOptimizeImage(src))
      }
    />
  )
}
