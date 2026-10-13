import Link from "next/link"
import { notFound } from "next/navigation"

import { BundleBookingForm } from "@/components/borrow/bundle-booking-form"
import { BundleEditForm } from "@/components/borrow/bundle-edit-form"
import { DeleteBundleButton } from "@/components/borrow/delete-bundle-button"
import { MediaPoster } from "@/components/shared/media-poster"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@workspace/ui/components/button"

export default async function BundlePage({ params }: { params: Promise<{ id: string }> }) {
  const active = await requireActiveMember()
  const { id } = await params
  const supabase = await createClient()
  const bundleResult = await supabase
    .from("bundles")
    .select("id,title,description,cover_path,owner_id,is_demo,bundle_items(position,items(id,title,photo_paths,deposit_rm,max_loan_days,handover_options))")
    .eq("id", id)
    .eq("township_id", active.townshipId)
    .maybeSingle()
  if (!bundleResult.data) notFound()
  const bundle = bundleResult.data
  const items = (bundle.bundle_items ?? [])
    .map((entry) => entry.items)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => (left.title ?? "").localeCompare(right.title ?? ""))
  const handoverOptions = Array.from(new Set(items.flatMap((item) => item.handover_options ?? [])))
  const isOwner = bundle.owner_id === active.user.id
  const ownerItemsResult = isOwner
    ? await supabase.from("items").select("id,title").eq("owner_id", active.user.id).eq("township_id", active.townshipId).eq("status", "active").eq("hidden", false).order("title")
    : { data: [], error: null }
  if (ownerItemsResult.error) throw new Error(ownerItemsResult.error.message)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageBand
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow="Pinjam · Bundle"
        title={bundle.title}
        description={bundle.description}
      />
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section aria-labelledby="bundle-items-heading">
          <h2 id="bundle-items-heading" className="text-title text-ink">In this bundle</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <li key={item.id}>
                <Link href={`/borrow/items/${item.id}`} className="block">
                  <MediaPoster
                    src={item.photo_paths?.[0] ?? "/demo/item-placeholder.svg"}
                    alt=""
                    className="border border-hairline bg-lilac-tint"
                    sizes="(min-width: 768px) 30vw, 50vw"
                  />
                  <p className="mt-2 font-bold text-ink">{item.title}</p>
                </Link>
              </li>
            ))}
          </ul>
          {!items.length ? <p className="mt-4 rounded-lg bg-surface p-4 text-sm text-ink-muted">This bundle has no available items yet.</p> : null}
        </section>
        <section aria-labelledby="bundle-request-heading" className="bb-card p-5">
          <h2 id="bundle-request-heading" className="text-title text-ink">Request all together</h2>
          <div className="mt-4">
            <BundleBookingForm bundleId={bundle.id} handoverOptions={handoverOptions.length ? handoverOptions : ["Meet in a shared space"]} />
          </div>
        </section>
      </div>
      {isOwner ? (
        <div className="mt-8">
          <BundleEditForm
            bundleId={bundle.id}
            title={bundle.title}
            description={bundle.description ?? ""}
            items={ownerItemsResult.data ?? []}
            selectedIds={items.map((item) => item.id)}
          />
          <DeleteBundleButton bundleId={bundle.id} />
        </div>
      ) : null}
    </div>
  )
}
