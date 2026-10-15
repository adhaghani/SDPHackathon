import { createClient } from "@supabase/supabase-js"
import { loadDemoEnv, requiredEnv } from "./env"

// Trusted operator command only. Never call this from a web action or seed.
async function main() {
  loadDemoEnv()
  const email = process.argv[2]?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run superadmin:grant -- owner@example.com")
  }
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const admin = createClient(url, requiredEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  let userId: string | undefined
  for (let page = 1; !userId; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    })
    if (error)
      throw new Error(
        "Could not find the account. Check the project URL and secret key."
      )
    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) {
      if (!match.email_confirmed_at)
        throw new Error(
          "Confirm this account’s email before granting superadmin access."
        )
      userId = match.id
    }
    if (data.users.length < 200) break
  }
  if (!userId)
    throw new Error(
      "Account not found. Register and confirm the owner’s account first."
    )
  const { error } = await admin
    .from("platform_admins")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
  if (error)
    throw new Error(
      "Could not grant access. Apply the platform migration first."
    )
  console.log(
    `Superadmin access granted to ${email} on ${new URL(url).host}. Sign in at /superadmin.`
  )
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Superadmin setup failed."
  )
  process.exitCode = 1
})
