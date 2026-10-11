import { readFileSync } from "node:fs"
import { resolve } from "node:path"

function parseEnvFile(path: string): Record<string, string> {
  const values: Record<string, string> = {}

  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue
      const separator = line.indexOf("=")
      if (separator < 1) continue
      const key = line.slice(0, separator).trim()
      const value = line.slice(separator + 1).trim()
      values[key] = value.replace(/^["']|["']$/g, "")
    }
  } catch {
    // The caller provides a clear missing-variable error.
  }

  return values
}

export function loadDemoEnv(): void {
  const rootEnv = parseEnvFile(resolve(process.cwd(), ".env.local"))
  const appEnv = parseEnvFile(resolve(process.cwd(), "apps/web/.env.local"))

  for (const [key, value] of Object.entries({ ...appEnv, ...rootEnv })) {
    process.env[key] ??= value
  }
}

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}
