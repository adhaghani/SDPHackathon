import Link from "next/link"

import { AcceptOfferButton } from "@/components/borrow/accept-offer-button"
import { ItemOfferForm } from "@/components/borrow/item-offer-form"
import { ItemRequestForm } from "@/components/borrow/item-request-form"
import { DemoLabel } from "@/components/shared/demo-label"
import { PageBand } from "@/components/shared/page-band"
import { requireActiveMember } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@workspace/ui/components/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty"

type RequestRow = {
  id: string
  requester_id: string
  title: string
  category_name?: string | null
  needed_from?: string | null
  needed_until?: string | null
  note?: string
  status: string
  is_demo?: boolean
}

export default async function ItemRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string }>
}) {
  const active = await requireActiveMember()
  const params = await searchParams
  const supabase = await createClient()
  const [requestsResult, categoriesResult, itemsResult] = await Promise.all([
    supabase.rpc("get_item_requests"),
    supabase.from("item_categories").select("slug,name,kind").order("name"),
    supabase
      .from("items")
      .select("id,title")
      .eq("owner_id", active.user.id)
      .eq("status", "active")
      .eq("hidden", false)
      .order("title"),
  ])
  if (requestsResult.error) throw new Error(requestsResult.error.message)
  if (categoriesResult.error) throw new Error(categoriesResult.error.message)
  if (itemsResult.error) throw new Error(itemsResult.error.message)
  const requests = (requestsResult.data ?? []) as RequestRow[]

  const offersResult = requests.length
    ? await supabase
        .from("item_request_offers")
        .select("id,request_id,offerer_id,item_id,message,status,items(id,title)")
        .in("request_id", requests.map((request) => request.id))
        .order("created_at")
    : { data: [] as never[], error: null }
  if (offersResult.error) throw new Error(offersResult.error.message)
  const offersByRequest = new Map<string, Array<Record<string, unknown>>>()
  for (const offer of (offersResult.data ?? []) as Array<Record<string, unknown>>) {
    const requestId = String(offer.request_id)
    const list = offersByRequest.get(requestId) ?? []
    list.push(offer)
    offersByRequest.set(requestId, list)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <PageBand
        back={{ href: "/borrow", label: "Borrow" }}
        eyebrow="Pinjam · Request"
        title="Request an item"
        description="Ask neighbours for what you need. Matching owners and category alerts receive a notification."
      />
      <div className="grid gap-7 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="post-request-heading" className="bb-card p-5">
          <h2 id="post-request-heading" className="text-title text-ink">Post a request</h2>
          <p className="mt-1 text-sm text-ink-muted">You can keep up to three open requests.</p>
          <div className="mt-4">
            <ItemRequestForm
              categories={(categoriesResult.data ?? []).map((category) => ({ ...category, kind: category.kind ?? "item" }))}
              initialTitle={params.prefill ?? ""}
            />
          </div>
        </section>

        <section aria-labelledby="requests-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="requests-heading" className="text-heading text-ink">Open around the township</h2>
            <span className="text-sm text-ink-muted">{requests.filter((request) => request.status === "open").length} open</span>
          </div>
          {requests.length ? (
            <ul className="mt-4 flex flex-col gap-4">
              {requests.map((request) => {
                const ownRequest = request.requester_id === active.user.id
                const requestOffers = offersByRequest.get(request.id) ?? []
                return (
                  <li key={request.id} className="bb-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-title text-ink">{request.title}</h3>
                          {request.is_demo ? <DemoLabel /> : null}
                        </div>
                        <p className="mt-1 text-sm text-ink-muted">
                          {request.category_name ?? "Any category"}
                          {request.needed_from ? ` · from ${request.needed_from}` : ""}
                          {request.needed_until ? ` · until ${request.needed_until}` : ""}
                        </p>
                        {request.note ? <p className="mt-2 max-w-[70ch] text-sm text-ink">{request.note}</p> : null}
                      </div>
                      <Badge variant={request.status === "open" ? "secondary" : "outline"}>
                        {request.status}
                      </Badge>
                    </div>

                    {!ownRequest && request.status === "open" ? (
                      <ItemOfferForm requestId={request.id} items={(itemsResult.data ?? []).filter((item) => !requestOffers.some((offer) => String(offer.item_id) === item.id))} />
                    ) : null}

                    {ownRequest && requestOffers.length ? (
                      <ul className="mt-4 space-y-3 border-t border-hairline pt-4">
                        {requestOffers.map((offer) => {
                          const item = offer.items as { id?: string; title?: string } | null
                          return (
                            <li key={String(offer.id)} className="rounded-lg bg-ground p-3">
                              <p className="font-bold text-ink">{item?.title ?? "Message-only offer"}</p>
                              {offer.message ? <p className="mt-1 text-sm text-ink-muted">{String(offer.message)}</p> : null}
                              {offer.status === "proposed" && item ? (
                                <div className="mt-3"><AcceptOfferButton offerId={String(offer.id)} /></div>
                              ) : (
                                <p className="mt-2 text-xs font-bold text-ink-muted">{String(offer.status)}</p>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <Empty className="mt-4">
              <EmptyHeader>
                <EmptyTitle>No requests yet</EmptyTitle>
                <EmptyDescription>Post the first request and matching neighbours will see it.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          <p className="mt-4 text-sm text-ink-muted">
            Looking for something specific? <Link href="/borrow" className="font-bold text-ink underline underline-offset-4">Search available items</Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
