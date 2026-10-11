import { ArrowRightIcon, CircleCheckIcon, PackageIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-sm font-medium text-rimba-ink">Your next stop</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold sm:text-4xl">
          Home is ready
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The foundation is in place. The core loop arrives with Phase 1.
        </p>
      </section>

      <section
        aria-labelledby="todo-heading"
        className="border-y border-border"
      >
        <div className="flex items-center justify-between py-4">
          <h2 id="todo-heading" className="font-heading text-lg font-semibold">
            To do
          </h2>
          <Badge variant="outline">0 waiting</Badge>
        </div>
        <div className="flex items-start gap-3 border-t border-border py-6 text-muted-foreground">
          <CircleCheckIcon
            aria-hidden="true"
            className="mt-0.5 size-5 text-line-impact"
          />
          <div>
            <p className="font-medium text-foreground">
              Nothing needs you right now
            </p>
            <p className="mt-1 text-sm">
              Confirmations, handovers and help completions will appear here.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="foundation-heading">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2
              id="foundation-heading"
              className="font-heading text-lg font-semibold"
            >
              Township line
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Activities become stops only after they are verified.
            </p>
          </div>
          <Badge variant="outline">Phase 0</Badge>
        </div>
        <ol className="mt-5 border-l-4 border-line-borrow pl-5">
          {[
            [
              "Foundation",
              "Auth, Supabase and responsive navigation",
              "Complete",
            ],
            ["Discover", "Events and items to borrow", "Next"],
            ["Verify", "QR check-in and two-sided confirmation", "Soon"],
            ["Recognise", "BetterPoints and badges", "Soon"],
          ].map(([title, description, status]) => (
            <li key={title} className="relative py-4">
              <span
                aria-hidden="true"
                className="absolute top-6 -left-[27px] size-3 rounded-full border-4 border-background bg-line-borrow"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{title}</p>
                <span className="text-xs text-muted-foreground">{status}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <PackageIcon
            aria-hidden="true"
            className="mt-1 size-5 text-line-borrow"
          />
          <div>
            <p className="font-medium">No items listed yet</p>
            <p className="text-sm text-muted-foreground">
              Phase 1 will let neighbours borrow and lend.
            </p>
          </div>
        </div>
        <Button render={<Link href="/" />} className="h-11 gap-2">
          View the demo journey
          <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
        </Button>
      </section>
    </div>
  )
}
