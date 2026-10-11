import { ItemForm } from "@/components/borrow/item-form"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

export default async function NewItemPage() {
  await requireActiveMember()
  const supabase = await createClient()
  const categories = await supabase.from("item_categories").select("id,slug,name").order("name")
  if (categories.error) throw new Error(categories.error.message)

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-line-borrow">Pinjam · Share</p>
      <h1 className="mt-1 font-heading text-3xl font-semibold">List an item</h1>
      <p className="mt-2 text-muted-foreground">
        Share something useful with your neighbours. Deposits are recorded only and arranged offline.
      </p>
      <div className="mt-7 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <ItemForm categories={categories.data ?? []} />
      </div>
    </div>
  )
}
