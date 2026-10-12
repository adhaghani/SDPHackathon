import Link from "next/link"
import { notFound } from "next/navigation"

import { BundleBookingForm } from "@/components/borrow/bundle-booking-form"
import { DemoLabel } from "@/components/shared/demo-label"
import { MediaPoster } from "@/components/shared/media-poster"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"

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

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageBand
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow="Pinjam · Bundle"
        title={bundle.title}
        description={bundle.description}
        actions={bundle.is_demo ? <DemoLabel /> : undefined}
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
    </div>
  )
}
