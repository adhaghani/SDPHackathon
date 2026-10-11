import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google"

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

const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
})

const bricolage = Bricolage_Grotesque({
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
        atkinson.variable,
        bricolage.variable,
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
