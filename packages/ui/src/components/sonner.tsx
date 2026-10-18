"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react"

import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

const Toaster = ({ className, toastOptions, ...props }: ToasterProps) => {
  const { resolvedTheme = "light" } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      position={isMobile ? "top-center" : "bottom-right"}
      className={cn("toaster group", className)}
      closeButton
      expand
      visibleToasts={2}
      duration={4000}
      gap={12}
      offset={{
        top: "calc(env(safe-area-inset-top, 0px) + 16px)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
        left: 24,
        right: 24,
      }}
      mobileOffset={{
        top: "calc(env(safe-area-inset-top, 0px) + 16px)",
        left: 16,
        right: 16,
      }}
      containerAriaLabel="Action notifications"
      icons={{
        success: <CircleCheckIcon className="size-5" aria-hidden="true" />,
        info: <InfoIcon className="size-5" aria-hidden="true" />,
        warning: <TriangleAlertIcon className="size-5" aria-hidden="true" />,
        error: (
          <OctagonXIcon
            className="size-5 text-destructive"
            aria-hidden="true"
          />
        ),
        loading: (
          <Loader2Icon
            className="size-5 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        ),
        close: <XIcon className="size-4" aria-hidden="true" />,
      }}
      toastOptions={{
        ...toastOptions,
        unstyled: true,
        closeButtonAriaLabel: "Dismiss notification",
        classNames: {
          toast:
            "relative flex w-full flex-wrap items-start gap-3 rounded-2xl border border-border bg-popover p-4 pr-14 font-sans text-popover-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          icon: "mt-0.5 flex shrink-0 items-center justify-center",
          content: "flex min-w-0 flex-1 flex-col gap-1",
          title: "text-sm leading-snug font-semibold [overflow-wrap:anywhere]",
          description:
            "text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]",
          actionButton:
            "min-h-11 max-w-full cursor-pointer rounded-full bg-primary px-3 py-2 text-sm leading-snug font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          closeButton:
            "absolute top-1 right-1 flex size-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          ...toastOptions?.classNames,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
