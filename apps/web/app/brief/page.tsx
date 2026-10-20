import type { Metadata } from "next"
import { BriefPresentation } from "./presentation"
import { sceneIndex } from "./scenes"

export const metadata: Metadata = {
  title: "3R pitch brief",
  description: "BorrowLah's planet-first presentation: Reduce, Reuse, Recycle.",
  robots: { index: false, follow: false },
}

export default async function BriefPage({
  searchParams,
}: {
  searchParams: Promise<{ scene?: string; clean?: string; beat?: string }>
}) {
  const params = await searchParams
  return (
    <BriefPresentation
      initialScene={sceneIndex(params.scene)}
      initialBeat={Number(params.beat ?? "1") - 1}
      initialClean={params.clean === "1"}
    />
  )
}
