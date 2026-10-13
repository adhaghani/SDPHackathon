import { execFileSync } from "node:child_process"
import path from "node:path"

export default function globalSetup(): void {
  const repoRoot = path.resolve(process.cwd(), "../..")
  execFileSync("npm", ["run", "demo:reset"], {
    cwd: repoRoot,
    stdio: "inherit",
  })
}
