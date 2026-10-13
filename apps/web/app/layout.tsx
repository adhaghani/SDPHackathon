import type { Viewport } from "next"
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google"

import "@workspace/ui/globals.css"
import { Toaster } from "@workspace/ui/components/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { PwaRegister } from "@/components/shared/pwa-register"
import { cn } from "@workspace/ui/lib/utils"

export const metadata = {
  title: {
    default: "BorrowLah",
    template: "%s · BorrowLah",
  },
  description: "Share more. Connect more. Live better.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d9f45a" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  colorScheme: "light",
  viewportFit: "cover",
}

const instrumentSans = Instrument_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
})

const bricolageGrotesque = Bricolage_Grotesque({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  variable: "--font-bricolage",
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
        instrumentSans.variable,
        bricolageGrotesque.variable,
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
