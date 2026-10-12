import type { Viewport } from "next"
import { DM_Sans, Syne } from "next/font/google"

import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { PwaRegister } from "@/components/shared/pwa-register"
import { cn } from "@workspace/ui/lib/utils"

export const metadata = {
  title: {
    default: "BorrowBetter",
    template: "%s · BorrowBetter",
  },
  description: "Share more. Connect more. Live better.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B1340" },
    { media: "(prefers-color-scheme: dark)", color: "#120D2E" },
  ],
  colorScheme: "light",
  viewportFit: "cover",
}

const dmSans = DM_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const syne = Syne({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        dmSans.variable,
        syne.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>
          <PwaRegister />
          {children}
          <Toaster position="top-center" closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
