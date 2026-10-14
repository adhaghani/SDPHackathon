import { execFileSync } from "node:child_process"
import path from "node:path"

export default function globalSetup(): void {
  if (process.env.E2E_SKIP_RESET === "true" || process.env.PLAYWRIGHT_BASE_URL) return
  const repoRoot = path.resolve(process.cwd(), "../..")
  execFileSync("npm", ["run", "demo:reset"], {
    cwd: repoRoot,
    stdio: "inherit",
  })
}
