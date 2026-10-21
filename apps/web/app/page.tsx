import type { Metadata } from "next"
import ProductionLanding, {
  metadata as productionMetadata,
} from "./production-landing"
import { JudgesLanding } from "@/components/judges/landing"
import { isJudgesPreview } from "@/lib/judges/config"

export function generateMetadata(): Metadata {
  return isJudgesPreview()
    ? {
        title: "BorrowLah · Judges preview",
        description:
          "Explore four perspectives of a connected township. Interactive seeded demo; no sign-in required.",
        robots: { index: false, follow: false },
      }
    : productionMetadata
}

export default function Page() {
  return isJudgesPreview() ? <JudgesLanding /> : <ProductionLanding />
}
