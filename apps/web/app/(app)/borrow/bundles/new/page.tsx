import { BundleCreateForm } from "@/components/borrow/bundle-create-form"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function NewBundlePage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const itemsResult = await supabase
    .from("items")
    .select("id,title")
    .eq("owner_id", active.user.id)
    .eq("township_id", active.townshipId)
    .eq("status", "active")
    .eq("hidden", false)
    .order("title")
  if (itemsResult.error) throw new Error(itemsResult.error.message)

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageBand
        back={{ href: "/borrow/mine", label: "Borrowing and lending" }}
        eyebrow="Pinjam · Bundle"
        title="Create a bundle"
        description="Group two to twelve of your active items so neighbours can request them together."
      />
      <div className="mt-6">
        <BundleCreateForm items={itemsResult.data ?? []} />
      </div>
    </div>
  )
}
