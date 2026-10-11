import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { joinTownshipSchema } from "@/lib/validation/membership"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const parsed = joinTownshipSchema.safeParse({
    joinCode: formData.get("joinCode"),
    neighbourhoodId: formData.get("neighbourhoodId"),
    unitLabel: formData.get("unitLabel") || undefined,
  })

  if (!parsed.success) {
    return redirectResponse("/onboarding?error=check_fields")
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("join_township", {
    p_join_code: parsed.data.joinCode,
    p_neighbourhood_id: parsed.data.neighbourhoodId,
    p_unit_label: parsed.data.unitLabel,
  })

  if (error) {
    return redirectResponse("/onboarding?error=join_failed")
  }

  const result = data as { status?: string }
  if (result.status === "active") {
    return redirectResponse("/home")
  }

  return redirectResponse("/onboarding?joined=1")
}

function redirectResponse(location: string): NextResponse {
  const response = new NextResponse(null, { status: 303 })
  response.headers.set("Location", location)
  return response
}
