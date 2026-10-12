import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-4">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">That stop is not on this route</h1>
      <p className="mt-3 text-muted-foreground">The page may have moved, or you may not have access to it.</p>
      <Button render={<Link href="/home" />} className="mt-6 h-11">Return home</Button>
    </main>
  )
}
