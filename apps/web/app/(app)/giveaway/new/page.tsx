import { GiveawayForm } from "@/components/giveaway/giveaway-form"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function NewGiveawayPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const categoriesResult = await supabase
    .from("item_categories")
    .select("id,slug,name,kind")
    .eq("kind", "item")
    .order("name")

  if (categoriesResult.error) throw new Error(categoriesResult.error.message)

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageBand
        back={{ href: "/giveaway", label: "Giveaway" }}
        eyebrow="Beri · Share"
        title="List a giveaway"
        description="Let go of something old, unused, or no longer working. It stays free for the community."
      />
      <GiveawayForm categories={categoriesResult.data ?? []} />
    </div>
  )
}
