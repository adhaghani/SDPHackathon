import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("health_check")

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Database check failed" },
        { status: 503 }
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch {
    return NextResponse.json(
      { ok: false, error: "Service configuration is incomplete" },
      { status: 503 }
    )
  }
}
