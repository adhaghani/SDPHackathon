import { ItemForm } from "@/components/borrow/item-form"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function NewItemPage() {
  const active = await requireActiveMember()
  const supabase = await createClient()
  const [categoriesResult, facilitiesResult] = await Promise.all([
    supabase.from("item_categories").select("id,slug,name,kind").order("name"),
    supabase.from("facilities").select("id,name").eq("township_id", active.townshipId).order("name"),
  ])
  if (categoriesResult.error) throw new Error(categoriesResult.error.message)
  if (facilitiesResult.error) throw new Error(facilitiesResult.error.message)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageBand
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow="Pinjam · Share"
        title="List an item"
        description="Share something useful with your neighbours. Deposits are recorded only and arranged offline."
      />
      <ItemForm categories={categoriesResult.data ?? []} facilities={facilitiesResult.data ?? []} />
    </div>
  )
}
