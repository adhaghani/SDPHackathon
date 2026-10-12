import { ItemForm } from "@/components/borrow/item-form"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function NewItemPage() {
  await requireActiveMember()
  const supabase = await createClient()
  const categories = await supabase.from("item_categories").select("id,slug,name").order("name")
  if (categories.error) throw new Error(categories.error.message)

  return (
    <div className="mx-auto max-w-3xl">
      <PageBand
        eyebrow="Pinjam · Share"
        title="List an item"
        description="Share something useful with your neighbours. Deposits are recorded only and arranged offline."
      />
      <div className="bb-card p-5 sm:p-7">
        <ItemForm categories={categories.data ?? []} />
      </div>
    </div>
  )
}
