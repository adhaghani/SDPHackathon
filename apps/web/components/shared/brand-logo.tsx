import Image from "next/image"

import { cn } from "@workspace/ui/lib/utils"

export function BrandLogo({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark"
  className?: string
}) {
  return (
    <Image
      src={`/brand/borrowlah-logo-${variant}.svg`}
      alt="BorrowLah"
      width={1367}
      height={240}
      className={cn("h-auto w-40 max-w-full shrink-0", className)}
    />
  )
}
