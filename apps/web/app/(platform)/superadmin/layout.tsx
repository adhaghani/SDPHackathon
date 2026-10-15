import { BrandLogo } from "@/components/shared/brand-logo"
import Link from "next/link"
import { requirePlatformAdmin } from "@/lib/platform"
import { SignOutButton } from "@/components/navigation/sign-out-button"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requirePlatformAdmin()
  return (
    <div className="min-h-svh bg-paper text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[2000] focus:bg-lime focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-hairline bg-ink text-paper">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link
            href="/superadmin"
            className="flex min-h-11 items-center gap-3 font-display text-xl font-extrabold"
          >
            <BrandLogo variant="dark" className="w-32 sm:w-40" />
            <span className="border-l border-paper/30 pl-3 text-sm font-medium">
              Superadmin
            </span>
          </Link>
          <div className="flex min-w-0 items-center gap-3">
            <span className="max-w-48 truncate text-sm max-sm:hidden">
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10"
      >
        {children}
      </main>
    </div>
  )
}
