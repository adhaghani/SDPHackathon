import { getPlatformTownships } from "@/lib/platform"
import { TownshipDirectory } from "@/components/platform/township-directory"

export default async function SuperadminPage() {
  return <TownshipDirectory townships={await getPlatformTownships()} />
}
