import { execFileSync } from "node:child_process"

execFileSync("npx", ["supabase@2.120.0", "db", "reset", "--local"], {
  stdio: "inherit",
})
execFileSync("npx", ["tsx", "scripts/seed-demo.ts"], {
  stdio: "inherit",
})
