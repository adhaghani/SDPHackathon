import Link from "next/link"
import { getPlatformTownships } from "@/lib/platform"
import { TownshipForm } from "@/components/platform/township-form"

export default async function NewTownshipPage() {
  const townships = await getPlatformTownships()
  return (
    <div className="flex flex-col gap-7">
      <Link
        href="/superadmin"
        className="w-fit text-sm font-bold underline underline-offset-4"
      >
        Back to townships
      </Link>
      <h1 className="font-display text-4xl font-extrabold tracking-tight">
        Create a township
      </h1>
      <TownshipForm townships={townships} />
    </div>
  )
}
