import Link from "next/link"

import { authContent } from "@/content/auth"
import { Badge } from "@workspace/ui/components/badge"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-heading text-lg font-semibold">
            {authContent.brand}
          </Link>
          <Badge variant="outline">Demo-friendly</Badge>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:items-center lg:py-16"
      >
        <section className="max-w-xl">
          <p className="font-heading text-sm font-medium text-rimba-ink">
            {authContent.tagline}
          </p>
          <div
            aria-hidden="true"
            className="mt-6 grid gap-4 border-l-4 border-line-event pl-5"
          >
            {[
              {
                label: "Jom",
                text: "Joined the Saturday gotong-royong",
                dot: "bg-line-event",
              },
              {
                label: "Pinjam",
                text: "Lent a ladder",
                dot: "bg-line-borrow",
              },
              {
                label: "Tolong",
                text: "Helped carry groceries",
                dot: "bg-line-help",
              },
              {
                label: "Rimba",
                text: "Community garden challenge",
                dot: "bg-line-impact",
              },
            ].map(({ label, text, dot }) => (
              <div key={label} className="relative flex items-center gap-3">
                <span
                  className={`absolute -left-[29px] size-3 rounded-full border-4 border-background ${dot}`}
                />
                <span className="w-14 text-xs font-medium text-muted-foreground">
                  {label}
                </span>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          {children}
        </section>
      </main>
    </div>
  )
}
