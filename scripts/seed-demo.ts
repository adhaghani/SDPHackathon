import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { randomUUID } from "node:crypto"

import { loadDemoEnv, requiredEnv } from "./env"

type Database = Record<string, never>

const DAY = 24 * 60 * 60 * 1000

const itemMockImages: Record<string, string> = {
  "Pressure washer": "/demo/item-pressure-washer.svg",
  "Folding ladder": "/demo/item-ladder.svg",
  "Camping tent": "/demo/item-tent.svg",
  "Badminton set": "/demo/item-badminton.svg",
  "Sewing machine": "/demo/item-sewing-machine.svg",
  Projector: "/demo/item-projector.svg",
  "Cordless drill": "/demo/item-drill.svg",
  "Cooler box": "/demo/item-cooler.svg",
  "Board game bundle": "/demo/item-board-games.svg",
  "Kids scooter": "/demo/item-scooter.svg",
  "Garden cart": "/demo/item-garden-cart.svg",
  "Pressure washer for the next clean-up": "/demo/item-pressure-washer.svg",
}

const demoUsers = [
  {
    email: "aisyah@borrowbetter.demo",
    displayName: "Aisyah Rahman",
    role: "resident" as const,
  },
  {
    email: "raj@borrowbetter.demo",
    displayName: "Raj Kumar",
    role: "organiser" as const,
  },
  {
    email: "office@borrowbetter.demo",
    displayName: "Township office",
    role: "township_admin" as const,
  },
  {
    email: "farah@borrowbetter.demo",
    displayName: "Farah Nordin",
    role: "resident" as const,
  },
  {
    email: "kopi@borrowbetter.demo",
    displayName: "Kopi Kita partner",
    role: "resident" as const,
  },
  { email: "mei@borrowbetter.demo", displayName: "Mei Ling Tan", role: "resident" as const },
  { email: "siti@borrowbetter.demo", displayName: "Siti Aminah", role: "resident" as const },
  { email: "kumar@borrowbetter.demo", displayName: "Kumar Raj", role: "resident" as const },
  { email: "nurul@borrowbetter.demo", displayName: "Nurul Huda", role: "resident" as const },
  { email: "lim@borrowbetter.demo", displayName: "Lim Wei", role: "resident" as const },
  { email: "priya@borrowbetter.demo", displayName: "Priya Nair", role: "resident" as const },
  { email: "azlan@borrowbetter.demo", displayName: "Azlan Musa", role: "resident" as const },
  { email: "hafiz@borrowbetter.demo", displayName: "Hafiz Rahman", role: "resident" as const },
  { email: "daniel@borrowbetter.demo", displayName: "Daniel Lee", role: "resident" as const },
  { email: "nadia@borrowbetter.demo", displayName: "Nadia Ismail", role: "resident" as const },
  { email: "cheryl@borrowbetter.demo", displayName: "Cheryl Wong", role: "resident" as const },
  { email: "syafiq@borrowbetter.demo", displayName: "Syafiq Zain", role: "resident" as const },
  { email: "kavitha@borrowbetter.demo", displayName: "Kavitha Devi", role: "resident" as const },
  { email: "ramesh@borrowbetter.demo", displayName: "Ramesh Kumar", role: "resident" as const },
  { email: "zara@borrowbetter.demo", displayName: "Zara Hakim", role: "resident" as const },
  { email: "amir@borrowbetter.demo", displayName: "Amir Hakimi", role: "resident" as const },
  { email: "joanne@borrowbetter.demo", displayName: "Joanne Goh", role: "resident" as const },
  { email: "hakim@borrowbetter.demo", displayName: "Hakim Omar", role: "resident" as const },
  { email: "felicia@borrowbetter.demo", displayName: "Felicia Tan", role: "resident" as const },
  { email: "ravi@borrowbetter.demo", displayName: "Ravi Subramaniam", role: "resident" as const },
  { email: "mira@borrowbetter.demo", displayName: "Mira Yusof", role: "resident" as const },
  { email: "brandon@borrowbetter.demo", displayName: "Brandon Sim", role: "resident" as const },
  { email: "ain@borrowbetter.demo", displayName: "Ain Zaleha", role: "resident" as const },
  { email: "kelvin@borrowbetter.demo", displayName: "Kelvin Ong", role: "resident" as const },
  { email: "sharma@borrowbetter.demo", displayName: "Sharma Nair", role: "resident" as const },
  { email: "faizal@borrowbetter.demo", displayName: "Faizal Ali", role: "resident" as const },
]

function isoAt(timestamp: number): string {
  return new Date(timestamp).toISOString()
}

async function ensureUser(
  admin: SupabaseClient<Database>,
  email: string,
  displayName: string
): Promise<string> {
  const password = process.env.DEMO_USER_PASSWORD ?? "BorrowBetter-Demo-2026!"
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = listed.data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  )

  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      user_metadata: {
        display_name: displayName,
        terms_accepted_at: isoAt(Date.now()),
        privacy_accepted_at: isoAt(Date.now()),
      },
    })
    return existing.id
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      terms_accepted_at: isoAt(Date.now()),
      privacy_accepted_at: isoAt(Date.now()),
    },
  })

  if (created.error || !created.data.user) {
    throw new Error(`Could not create demo user ${email}: ${created.error?.message}`)
  }

  return created.data.user.id
}

async function findOne(
  admin: SupabaseClient<Database>,
  table: string,
  filters: Record<string, unknown>
) {
  let query = admin.from(table).select("*")
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value as never)
  }
  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw new Error(`Could not read ${table}: ${error.message}`)
  return data
}

async function ensureTownship(admin: SupabaseClient<Database>) {
  const existing = await findOne(admin, "townships", { slug: "harmoni-heights-demo" })
  const row = {
    name: "Harmoni Heights (Demo Township)",
    slug: "harmoni-heights-demo",
    join_code: "HARMONI-DEMO",
    auto_approve_members: true,
    require_event_approval: false,
    timezone: "Asia/Kuala_Lumpur",
    rewards_enabled: true,
    is_demo: true,
    settings: { demo: true },
  }

  if (existing) {
    const { error } = await admin.from("townships").update(row).eq("id", existing.id)
    if (error) throw new Error(`Could not update demo township: ${error.message}`)
    return existing.id as string
  }

  const { data, error } = await admin.from("townships").insert(row).select("id").single()
  if (error || !data) throw new Error(`Could not create demo township: ${error?.message}`)
  return data.id as string
}

async function ensureReferenceRows(
  admin: SupabaseClient<Database>,
  townshipId: string
) {
  const neighbourhoodRows = ["Anggun", "Bestari", "Cahaya", "Damai"].map((name) => ({
    township_id: townshipId,
    name,
  }))
  const facilityRows = [
    { name: "Clubhouse hall", kind: "hall", capacity: 120, weekly_available_hours: 40 },
    { name: "Badminton courts", kind: "sports", capacity: 16, weekly_available_hours: 30 },
    { name: "Community garden", kind: "garden", capacity: 30, weekly_available_hours: 50 },
    { name: "Multipurpose field", kind: "field", capacity: 80, weekly_available_hours: 35 },
  ].map((row) => ({ ...row, township_id: townshipId }))

  await admin.from("neighbourhoods").upsert(neighbourhoodRows, { onConflict: "township_id,name" })
  await admin.from("facilities").upsert(facilityRows, { onConflict: "township_id,name" })

  const neighbourhoods = await admin
    .from("neighbourhoods")
    .select("id,name")
    .eq("township_id", townshipId)
  if (neighbourhoods.error) throw new Error(neighbourhoods.error.message)
  return neighbourhoods.data ?? []
}

async function ensureSecondTownship(
  admin: SupabaseClient<Database>,
  userIds: Record<string, string>
) {
  const existing = await findOne(admin, "townships", { slug: "damai-harmoni-demo" })
  const row = {
    name: "Damai Heights (Demo Township)",
    slug: "damai-harmoni-demo",
    join_code: "DAMAI-DEMO",
    auto_approve_members: true,
    require_event_approval: false,
    timezone: "Asia/Kuala_Lumpur",
    rewards_enabled: true,
    is_demo: true,
    settings: { demo: true },
  }
  let townshipId = existing?.id as string | undefined
  if (!townshipId) {
    const { data, error } = await admin.from("townships").insert(row).select("id").single()
    if (error || !data) throw new Error(`Could not create second demo township: ${error?.message}`)
    townshipId = data.id as string
  }
  await admin.from("neighbourhoods").upsert(
    { township_id: townshipId, name: "Damai" },
    { onConflict: "township_id,name" }
  )
  const neighbourhood = await admin.from("neighbourhoods").select("id").eq("township_id", townshipId).eq("name", "Damai").single()
  for (const email of ["aisyah@borrowbetter.demo", "raj@borrowbetter.demo", "office@borrowbetter.demo"]) {
    const userId = userIds[email]
    if (userId) {
      await admin.from("township_members").upsert(
        {
          township_id: townshipId,
          user_id: userId,
          role: email.startsWith("office") ? "township_admin" : email.startsWith("raj") ? "organiser" : "resident",
          status: "active",
          neighbourhood_id: neighbourhood.data?.id,
          approved_at: isoAt(Date.now()),
        },
        { onConflict: "township_id,user_id" }
      )
    }
  }
  return townshipId
}

async function ensureProfilesAndMembers(
  admin: SupabaseClient<Database>,
  townshipId: string,
  userIds: Record<string, string>,
  neighbourhoodId: string
) {
  for (const user of demoUsers) {
    const userId = userIds[user.email]
    await admin
      .from("profiles")
      .upsert(
        {
          id: userId,
          display_name: user.displayName,
          interests: ["community", "sustainability"],
          language: "en",
          comfort_prefs: {},
          recognition_opt_in: false,
          terms_accepted_at: isoAt(Date.now()),
          privacy_accepted_at: isoAt(Date.now()),
        },
        { onConflict: "id" }
      )

    await admin
      .from("township_members")
      .upsert(
        {
          township_id: townshipId,
          user_id: userId,
          role: user.role,
          status: "active",
          neighbourhood_id: neighbourhoodId,
          approved_at: isoAt(Date.now()),
        },
        { onConflict: "township_id,user_id" }
      )
  }
}

async function ensureEngagementData(
  admin: SupabaseClient<Database>,
  townshipId: string,
  userIds: Record<string, string>
) {
  const partners = [
    { name: "Kopi Kita", description: "Fictional neighbourhood café partner." },
    { name: "Harmoni Sports Club", description: "Fictional township amenity partner." },
    { name: "Rimba Garden", description: "Fictional community garden partner." },
  ].map((partner) => ({ ...partner, township_id: townshipId }))
  await admin.from("partners").upsert(partners, { onConflict: "township_id,name" })

  const partnerRows = await admin.from("partners").select("id,name").eq("township_id", townshipId)
  if (partnerRows.error) throw new Error(partnerRows.error.message)
  const partnerId = (name: string) => partnerRows.data?.find((partner) => partner.name === name)?.id
  const partnerUserId = userIds["kopi@borrowbetter.demo"]
  const kopiPartnerId = partnerId("Kopi Kita")
  if (partnerUserId && kopiPartnerId) {
    await admin.from("partner_accounts").upsert(
      { partner_id: kopiPartnerId, user_id: partnerUserId, active: true },
      { onConflict: "partner_id,user_id" }
    )
  }

  const rewards = [
    { partner: "Kopi Kita", title: "Kopi Kita voucher", description: "A drink at the fictional Kopi Kita café.", kind: "voucher", cost_bp: 300, unit_cost_rm: 8, funded_by: "sponsor", stock: 20, per_user_limit: 1 },
    { partner: "Harmoni Sports Club", title: "Clubhouse badminton hour", description: "One hour on a fictional badminton court.", kind: "amenity", cost_bp: 500, unit_cost_rm: 0, funded_by: "operator", stock: 10, per_user_limit: 1 },
    { partner: "Rimba Garden", title: "Community garden compost bag", description: "A bag of compost from the fictional garden.", kind: "amenity", cost_bp: 200, unit_cost_rm: 5, funded_by: "sponsor", stock: 15, per_user_limit: 2 },
  ].map((reward) => ({
    township_id: townshipId,
    partner_id: partnerId(reward.partner),
    title: reward.title,
    description: reward.description,
    kind: reward.kind,
    cost_bp: reward.cost_bp,
    unit_cost_rm: reward.unit_cost_rm,
    funded_by: reward.funded_by,
    stock: reward.stock,
    per_user_limit: reward.per_user_limit,
    valid_until: new Date(Date.now() + 90 * DAY).toISOString().slice(0, 10),
    active: true,
  }))
  await admin.from("rewards").upsert(rewards, { onConflict: "township_id,title" })

  const challenges = [
    { title: "Two helping actions this month", description: "Complete two helping actions in the next 30 days.", scope: "individual", action_types: ["help_completed"], target: 2, reward_points: 100 },
    { title: "100 township loans", description: "The township completes 100 verified borrows.", scope: "community", action_types: ["item_lent_completed"], target: 100, reward_points: 200 },
  ].map((challenge) => ({
    township_id: townshipId,
    ...challenge,
    starts_at: new Date(Date.now() - 30 * DAY).toISOString(),
    ends_at: new Date(Date.now() + 30 * DAY).toISOString(),
    status: "active",
  }))
  await admin.from("challenges").upsert(challenges, { onConflict: "township_id,title" })

  const office = userIds["office@borrowbetter.demo"]
  const siti = userIds["siti@borrowbetter.demo"]
  await admin.from("announcements").upsert(
    [{
      township_id: townshipId,
      author_id: office,
      title: "Welcome to Harmoni Heights",
      body: "BorrowBetter is a fictional demo township. Meet in shared spaces and look out for one another.",
      pinned: true,
    }],
    { onConflict: "township_id,title" }
  )
  await admin.from("help_requests").upsert(
    [{
      township_id: townshipId,
      requester_id: siti,
      title: "Help carry groceries",
      details: "A short helping request for the demo community tab.",
      kind: "errand",
      needed_by: new Date(Date.now() + 2 * DAY).toISOString().slice(0, 10),
      status: "open",
    }],
    { onConflict: "township_id,requester_id,title" }
  )
  await admin.from("interest_groups").upsert(
    [
      { township_id: townshipId, name: "Community garden", description: "Grow, share and learn together." },
      { township_id: townshipId, name: "Weekend sports", description: "Casual sports and fitness meetups." },
    ],
    { onConflict: "township_id,name" }
  )
  await admin.from("reward_rules").upsert(
    [{ township_id: townshipId, action_type: "challenge_completed", category_slug: null, points: 200, active: true }],
    { onConflict: "township_id,action_type,category_slug" }
  )
}

async function ensureEvent(
  admin: SupabaseClient<Database>,
  townshipId: string,
  hostId: string,
  categoryId: string,
  title: string,
  startsAt: number,
  options: {
    description?: string
    location?: string
    capacity?: number
    coverPath?: string
  } = {}
) {
  const existing = await findOne(admin, "events", { township_id: townshipId, title })
  if (existing) {
    if (options.coverPath) {
      const { error } = await admin.from("events").update({ cover_path: options.coverPath }).eq("id", existing.id as string)
      if (error) throw new Error(`Could not add the demo cover for ${title}: ${error.message}`)
    }
    return existing.id as string
  }

  const { data, error } = await admin
    .from("events")
    .insert({
      township_id: townshipId,
      host_id: hostId,
      title,
      description: options.description ?? "Fictional demo activity for Harmoni Heights.",
      category_id: categoryId,
      starts_at: isoAt(startsAt),
      ends_at: isoAt(startsAt + 2 * 60 * 60 * 1000),
      location_text: options.location ?? "Harmoni Heights shared space",
      capacity: options.capacity ?? 40,
      volunteer_slots: 8,
      accessibility_tags: ["step-free", "family-friendly"],
      languages: ["English", "Bahasa Malaysia"],
      status: "published",
      hidden: false,
      cover_path: options.coverPath ?? "/demo/event-placeholder.svg",
    })
    .select("id")
    .single()

  if (error || !data) throw new Error(`Could not create event ${title}: ${error?.message}`)

  await admin
    .from("event_staff")
    .upsert({ event_id: data.id, user_id: hostId }, { onConflict: "event_id,user_id" })

  return data.id as string
}

async function ensureRsvpAndCheckIn(
  admin: SupabaseClient<Database>,
  eventId: string,
  userId: string,
  occurredAt: number,
  method: "qr" | "manual" = "manual"
) {
  const existing = await findOne(admin, "event_rsvps", { event_id: eventId, user_id: userId })
  const rsvpId = existing?.id as string | undefined

  if (!rsvpId) {
    const { data, error } = await admin
      .from("event_rsvps")
      .insert({ event_id: eventId, user_id: userId, role: "attendee", status: "going" })
      .select("id,status")
      .single()
    if (error || !data) throw new Error(`Could not create RSVP: ${error?.message}`)
    return admin.rpc("check_in", {
      p_rsvp_id: data.id,
      p_method: method,
      p_occurred_at: isoAt(occurredAt),
    })
  }

  if (existing.status === "checked_in") return { error: null }
  return admin.rpc("check_in", {
    p_rsvp_id: rsvpId,
    p_method: method,
    p_occurred_at: isoAt(occurredAt),
  })
}

async function ensureItem(
  admin: SupabaseClient<Database>,
  townshipId: string,
  ownerId: string,
  categoryId: string,
  title: string,
  photoPath?: string
) {
  const existing = await findOne(admin, "items", { township_id: townshipId, title, owner_id: ownerId })
  if (existing) {
    const { error } = await admin.from("items").update({
      ...(photoPath ? { photo_paths: [photoPath] } : {}),
      kind: "item",
      value_source: "owner",
      estimated_new_price_rm: 250,
      requires_deposit: false,
      allow_deposit_waiver: false,
      min_trust_tier: null,
    }).eq("id", existing.id as string)
    if (error) throw new Error(`Could not refresh the demo item ${title}: ${error.message}`)
    return existing.id as string
  }

  const { data, error } = await admin
    .from("items")
    .insert({
      township_id: townshipId,
      owner_id: ownerId,
      title,
      description: "A fictional item available through the Harmoni Heights demo.",
      category_id: categoryId,
      kind: "item",
      condition: "good",
      estimated_new_price_rm: 250,
      value_source: "owner",
      requires_deposit: false,
      allow_deposit_waiver: false,
      min_trust_tier: null,
      deposit_rm: 0,
      max_loan_days: 4,
      handover_options: [" clubhouse lobby", "community garden gate"],
      photo_paths: photoPath ? [photoPath] : [],
      status: "active",
      hidden: false,
    })
    .select("id")
    .single()

  if (error || !data) throw new Error(`Could not create item ${title}: ${error?.message}`)
  return data.id as string
}

async function ensureDemoSearchEvents(
  admin: SupabaseClient<Database>,
  townshipId: string,
  neighbourhoodId: string,
  categoryId: string
) {
  const existing = await admin
    .from("search_events")
    .select("id")
    .eq("township_id", townshipId)
    .eq("is_demo", true)
    .limit(1)
  if (existing.error) throw new Error(`Could not read demo searches: ${existing.error.message}`)
  if (existing.data?.length) return

  const searches = [
    ["drill", 9, 2],
    ["gerudi", 6, 2],
    ["ladder", 7, 1],
    ["table", 12, 0],
    ["chair", 10, 0],
    ["periuk", 8, 1],
  ] as const

  const { error } = await admin.from("search_events").insert(
    searches.map(([term, results, available]) => ({
      township_id: townshipId,
      neighbourhood_id: neighbourhoodId,
      normalized_term: term,
      category_id: term === "drill" || term === "gerudi" ? categoryId : null,
      results_count: results,
      available_count: available,
      is_demo: true,
    }))
  )
  if (error) throw new Error(`Could not create demo searches: ${error.message}`)
}

async function ensureDemandDemoData(
  admin: SupabaseClient<Database>,
  townshipId: string,
  neighbourhoodId: string,
  userIds: Record<string, string>,
  itemCategoryId: (slug: string) => string,
  now: number
) {
  const aisyah = userIds["aisyah@borrowbetter.demo"]
  const farah = userIds["farah@borrowbetter.demo"]

  const skillRows = [
    {
      title: "Basic drill repair demo session",
      categoryId: itemCategoryId("repairs"),
      duration: 45,
      guardian: false,
    },
    {
      title: "After-school maths tuition demo session",
      categoryId: itemCategoryId("tuition"),
      duration: 60,
      guardian: true,
    },
  ]
  for (const skill of skillRows) {
    const existing = await findOne(admin, "items", { township_id: townshipId, title: skill.title })
    if (existing) continue
    const { error } = await admin.from("items").insert({
      township_id: townshipId,
      owner_id: rajIdForSeed(userIds),
      title: skill.title,
      description: "A fictional skill session for the BorrowBetter demo.",
      category_id: skill.categoryId,
      kind: "skill",
      condition: "good",
      photo_paths: ["/demo/item-placeholder.svg"],
      estimated_new_price_rm: null,
      value_source: "category_default",
      requires_deposit: false,
      deposit_rm: 0,
      allow_deposit_waiver: false,
      min_trust_tier: null,
      duration_minutes: skill.duration,
      meeting_arrangement: "arranged_by_message",
      guardian_acknowledgement: skill.guardian,
      max_loan_days: 1,
      handover_options: ["Arranged by message"],
      status: "active",
      hidden: false,
    })
    if (error) throw new Error(`Could not create demo skill ${skill.title}: ${error.message}`)
  }

  const bundleSpecs = [
    {
      title: "Camping kit",
      description: "Tent, cooler and sleeping essentials for a weekend away.",
      itemTitles: ["Camping tent", "Cooler box"],
    },
    {
      title: "Kenduri set",
      description: "Tables, chairs and a large pot for a shared meal.",
      itemTitles: ["Folding tables", "Folding chairs", "Periuk besar"],
    },
  ]
  const bundleItemTitles = ["Folding tables", "Folding chairs", "Periuk besar"]
  for (const title of bundleItemTitles) {
    const existing = await findOne(admin, "items", { township_id: townshipId, title })
    if (existing) continue
    const { error } = await admin.from("items").insert({
      township_id: townshipId,
      owner_id: aisyah,
      title,
      description: "A fictional item for the Kenduri set demo bundle.",
      category_id: itemCategoryId("kitchen"),
      kind: "item",
      condition: "good",
      photo_paths: ["/demo/item-placeholder.svg"],
      estimated_new_price_rm: 150,
      value_source: "owner",
      requires_deposit: false,
      deposit_rm: 0,
      allow_deposit_waiver: false,
      min_trust_tier: null,
      max_loan_days: 4,
      handover_options: ["Clubhouse lobby"],
      status: "active",
      hidden: false,
    })
    if (error) throw new Error(`Could not create bundle item ${title}: ${error.message}`)
  }

  for (const bundleSpec of bundleSpecs) {
    let bundle = await findOne(admin, "bundles", { township_id: townshipId, title: bundleSpec.title })
    if (!bundle) {
      const { data, error } = await admin
        .from("bundles")
        .insert({
          township_id: townshipId,
          owner_id: aisyah,
          title: bundleSpec.title,
          description: bundleSpec.description,
          cover_path: "/demo/item-placeholder.svg",
          is_demo: true,
        })
        .select("id")
        .single()
      if (error || !data) throw new Error(`Could not create demo bundle ${bundleSpec.title}: ${error?.message}`)
      bundle = data
    }
    const bundleId = bundle.id as string
    for (let index = 0; index < bundleSpec.itemTitles.length; index += 1) {
      const item = await findOne(admin, "items", {
        township_id: townshipId,
        title: bundleSpec.itemTitles[index],
      })
      if (!item) continue
      const { error } = await admin.from("bundle_items").upsert(
        {
          bundle_id: bundleId,
          item_id: item.id,
          position: index,
          is_demo: true,
        },
        { onConflict: "bundle_id,item_id" }
      )
      if (error) throw new Error(`Could not add ${bundleSpec.itemTitles[index]} to bundle: ${error.message}`)
    }

    const existingGroup = await findOne(admin, "booking_groups", { bundle_id: bundleId })
    if (!existingGroup) {
      const { data: group, error: groupError } = await admin
        .from("booking_groups")
        .insert({
          bundle_id: bundleId,
          township_id: townshipId,
          borrower_id: farah,
          lender_id: aisyah,
          start_date: new Date(now + 100 * DAY).toISOString().slice(0, 10),
          end_date: new Date(now + 103 * DAY).toISOString().slice(0, 10),
          status: "cancelled",
          is_demo: true,
        })
        .select("id")
        .single()
      if (groupError || !group) throw new Error(`Could not create demo booking group: ${groupError?.message}`)
      const children = await admin
        .from("bundle_items")
        .select("item_id")
        .eq("bundle_id", bundleId)
      if (children.error) throw new Error(children.error.message)
      for (const child of children.data ?? []) {
        const { error } = await admin.from("bookings").insert({
          item_id: child.item_id,
          township_id: townshipId,
          borrower_id: farah,
          lender_id: aisyah,
          start_date: new Date(now + 100 * DAY).toISOString().slice(0, 10),
          end_date: new Date(now + 103 * DAY).toISOString().slice(0, 10),
          handover_method: "Clubhouse lobby",
          booking_group_id: group.id,
          status: "cancelled",
        })
        if (error) throw new Error(`Could not create demo group booking: ${error.message}`)
      }
    }
  }

  const requestSpecs = [
    {
      title: "Need a cordless drill this weekend",
      status: "open",
      categoryId: itemCategoryId("home-tools"),
    },
    {
      title: "Need folding tables for a kenduri",
      status: "offered",
      categoryId: itemCategoryId("kitchen"),
    },
  ]
  for (const requestSpec of requestSpecs) {
    let request = await findOne(admin, "item_requests", {
      township_id: townshipId,
      title: requestSpec.title,
    })
    if (!request) {
      const { data, error } = await admin
        .from("item_requests")
        .insert({
          township_id: townshipId,
          requester_id: farah,
          title: requestSpec.title,
          category_id: requestSpec.categoryId,
          neighbourhood_id: neighbourhoodId,
          needed_from: new Date(now + 2 * DAY).toISOString().slice(0, 10),
          needed_until: new Date(now + 9 * DAY).toISOString().slice(0, 10),
          note: "Fictional demo request.",
          status: requestSpec.status,
          is_demo: true,
        })
        .select("id")
        .single()
      if (error || !data) throw new Error(`Could not create demo request: ${error?.message}`)
      request = data
    }
    if (requestSpec.status === "offered") {
      const offerTitle = requestSpec.title.includes("tables") ? "Folding tables" : "Cordless drill"
      const item = await findOne(admin, "items", { township_id: townshipId, title: offerTitle })
      const existingOffer = await findOne(admin, "item_request_offers", { request_id: request.id })
      if (item && !existingOffer) {
        const { error } = await admin.from("item_request_offers").insert({
          request_id: request.id,
          offerer_id: aisyah,
          item_id: item.id,
          message: "Available from the clubhouse.",
          status: "proposed",
          is_demo: true,
        })
        if (error) throw new Error(`Could not create demo offer: ${error.message}`)
      }
    }
  }

  const alertUsers = [
    "aisyah@borrowbetter.demo",
    "farah@borrowbetter.demo",
    "mei@borrowbetter.demo",
    "siti@borrowbetter.demo",
    "kumar@borrowbetter.demo",
  ]
  for (const email of alertUsers) {
    const { error } = await admin.from("item_request_alert_opt_ins").upsert(
      {
        user_id: userIds[email],
        township_id: townshipId,
        category_id: itemCategoryId("home-tools"),
        is_demo: true,
      },
      { onConflict: "user_id,township_id,category_id" }
    )
    if (error) throw new Error(`Could not create demo request alert: ${error.message}`)
  }
}

function rajIdForSeed(userIds: Record<string, string>): string {
  const id = userIds["raj@borrowbetter.demo"]
  if (!id) throw new Error("Raj demo user missing")
  return id
}

async function ensureBooking(
  admin: SupabaseClient<Database>,
  townshipId: string,
  itemId: string,
  borrowerId: string,
  lenderId: string,
  startDate: string,
  endDate: string
) {
  const existing = await findOne(admin, "bookings", {
    item_id: itemId,
    borrower_id: borrowerId,
    start_date: startDate,
    end_date: endDate,
  })
  if (existing) return existing.id as string

  const { data, error } = await admin
    .from("bookings")
    .insert({
      item_id: itemId,
      township_id: townshipId,
      borrower_id: borrowerId,
      lender_id: lenderId,
      start_date: startDate,
      end_date: endDate,
      status: "requested",
      handover_method: "Clubhouse lobby",
    })
    .select("id,status")
    .single()

  if (error || !data) throw new Error(`Could not create booking: ${error?.message}`)
  return data.id as string
}

async function transitionAs(
  admin: SupabaseClient<Database>,
  bookingId: string,
  action: string,
  actorId: string,
  payload: Record<string, unknown> = {},
  occurredAt?: number
) {
  const { error } = await admin.rpc("transition_booking", {
    p_booking_id: bookingId,
    p_action: action,
    p_payload: payload,
    p_actor_id: actorId,
    ...(occurredAt ? { p_occurred_at: isoAt(occurredAt) } : {}),
  })
  if (error) throw new Error(`Booking transition ${action} failed: ${error.message}`)
}

async function completeSeededBooking(
  admin: SupabaseClient<Database>,
  bookingId: string,
  borrowerId: string,
  lenderId: string,
  completedAt: number,
  wouldHaveBought: "yes" | "no" | "unsure"
) {
  const booking = await findOne(admin, "bookings", { id: bookingId })
  if (!booking || booking.status === "completed") return

  if (booking.status === "requested") {
    await transitionAs(admin, bookingId, "approve", lenderId)
  }

  const current = await findOne(admin, "bookings", { id: bookingId })
  if (!current.borrower_handover_confirmed_at) {
    await transitionAs(admin, bookingId, "confirm_handover", borrowerId, {}, completedAt - 2 * DAY)
  }
  if (!current.lender_handover_confirmed_at) {
    await transitionAs(admin, bookingId, "confirm_handover", lenderId, {}, completedAt - DAY)
  }
  if (!current.borrower_return_marked_at) {
    await transitionAs(admin, bookingId, "mark_returned", borrowerId, { would_have_bought: wouldHaveBought }, completedAt)
  }
  await transitionAs(admin, bookingId, "confirm_return", lenderId, {}, completedAt)
}

export async function seedDemo(): Promise<void> {
  loadDemoEnv()
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const key = requiredEnv("SUPABASE_SECRET_KEY")
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SupabaseClient<Database>

  const userIds: Record<string, string> = {}
  for (const user of demoUsers) {
    userIds[user.email] = await ensureUser(admin, user.email, user.displayName)
  }

  const townshipId = await ensureTownship(admin)
  await ensureSecondTownship(admin, userIds)
  const neighbourhoods = await ensureReferenceRows(admin, townshipId)
  const neighbourhoodId = neighbourhoods.find((row: { name: string }) => row.name === "Anggun")?.id
  if (!neighbourhoodId) throw new Error("Anggun neighbourhood missing")
  await ensureProfilesAndMembers(admin, townshipId, userIds, neighbourhoodId)
  await ensureEngagementData(admin, townshipId, userIds)

  const categories = await admin.from("event_categories").select("id,slug")
  const itemCategories = await admin.from("item_categories").select("id,slug")
  if (categories.error || itemCategories.error) {
    throw new Error(categories.error?.message ?? itemCategories.error?.message)
  }

  const categoryId = (slug: string) => {
    const row = categories.data?.find((category: { slug: string }) => category.slug === slug)
    if (!row) throw new Error(`Missing event category ${slug}`)
    return row.id as string
  }
  const itemCategoryId = (slug: string) => {
    const row = itemCategories.data?.find((category: { slug: string }) => category.slug === slug)
    if (!row) throw new Error(`Missing item category ${slug}`)
    return row.id as string
  }

  const aisyah = userIds["aisyah@borrowbetter.demo"]
  const raj = userIds["raj@borrowbetter.demo"]
  const office = userIds["office@borrowbetter.demo"]
  const now = Date.now()
  const eventTitles = [
    ["Saturday gotong-royong", "gotong-royong"],
    ["Community garden morning", "gotong-royong"],
    ["Repair café", "social"],
    ["Jogging group", "gotong-royong"],
    ["Neighbourhood market", "gardening"],
    ["Kids reading hour", "gotong-royong"],
    ["Seniors stretch class", "social"],
    ["Weekend sports mix", "gotong-royong"],
    ["Zero-waste workshop", "gardening"],
  ] as const

  for (let index = 0; index < eventTitles.length; index += 1) {
    const startsAt = now - (index + 2) * 7 * DAY
    const [title, slug] = eventTitles[index] ?? ["Demo event", "social"]
    const eventId = await ensureEvent(admin, townshipId, raj, categoryId(slug), title, startsAt)
    await ensureRsvpAndCheckIn(admin, eventId, aisyah, startsAt + 30 * 60 * 1000, index % 3 === 0 ? "qr" : "manual")
  }

  const hostedEventStart = now - 14 * DAY
  const hostedEventId = await ensureEvent(
    admin,
    townshipId,
    aisyah,
    categoryId("social"),
    "Aisyah's welcome tea",
    hostedEventStart
  )
  const farah = userIds["farah@borrowbetter.demo"]
  for (const attendee of [raj, office, farah]) {
    await ensureRsvpAndCheckIn(admin, hostedEventId, attendee, hostedEventStart + 30 * 60 * 1000, "qr")
  }
  await admin.rpc("complete_event", {
    p_event_id: hostedEventId,
    p_occurred_at: isoAt(hostedEventStart + 3 * 60 * 60 * 1000),
  })

  const futureTitles = [
    "Demo check-in window · gotong-royong",
    "Repair and reuse clinic",
    "Community kitchen night",
    "Evening badminton",
    "Garden compost workshop",
  ]
  for (let index = 0; index < futureTitles.length; index += 1) {
    const startsAt = index === 0 ? now + 20 * 60 * 1000 : now + (index + 2) * 7 * DAY
    await ensureEvent(
      admin,
      townshipId,
      index % 2 === 0 ? raj : office,
      categoryId(index === 0 ? "gotong-royong" : index % 2 === 0 ? "social" : "repair"),
      futureTitles[index] ?? "Demo event",
      startsAt,
      { coverPath: "/demo/event-placeholder.svg" }
    )
  }

  const itemTitles = [
    "Pressure washer",
    "Folding ladder",
    "Camping tent",
    "Badminton set",
    "Sewing machine",
    "Projector",
    "Cordless drill",
    "Cooler box",
    "Board game bundle",
    "Kids scooter",
    "Garden cart",
  ]

  for (let index = 0; index < itemTitles.length; index += 1) {
    const itemId = await ensureItem(
      admin,
      townshipId,
      aisyah,
      itemCategoryId(index % 2 === 0 ? "home-tools" : "events"),
      itemTitles[index] ?? "Demo item",
      itemMockImages[itemTitles[index] ?? ""]
    )
    const startDate = new Date(now - (index + 10) * 6 * DAY).toISOString().slice(0, 10)
    const endDate = new Date(now - (index + 10) * 6 * DAY + 3 * DAY).toISOString().slice(0, 10)
    const bookingId = await ensureBooking(admin, townshipId, itemId, raj, aisyah, startDate, endDate)
    const completedAt = index === 0 ? Date.parse(`${startDate}T10:00:00Z`) : Date.parse(`${endDate}T18:00:00Z`) + DAY
    await completeSeededBooking(admin, bookingId, raj, aisyah, completedAt, index === 0 ? "yes" : "no")
    if (index === 0) {
      await admin.rpc("award_points", {
        p_user_id: aisyah,
        p_township_id: townshipId,
        p_action_type: "item_returned_on_time",
        p_source_type: "booking_return",
        p_source_id: bookingId,
        p_category_slug: null,
        p_metadata: { seeded_return_confirmation: true },
        p_occurred_at: isoAt(completedAt),
      })
    }
  }

  await ensureDemoSearchEvents(
    admin,
    townshipId,
    neighbourhoodId,
    itemCategoryId("home-tools")
  )
  await ensureDemandDemoData(
    admin,
    townshipId,
    neighbourhoodId,
    userIds,
    itemCategoryId,
    now
  )
  await ensureEngagementV2DemoData(admin, townshipId, userIds, now)
  await ensureAdminIntelligenceDemoData(admin, townshipId, userIds, itemCategoryId)
  await ensureSupportDemoData(admin, townshipId, userIds)

  const demoBookingItem = await ensureItem(
    admin,
    townshipId,
    raj,
    itemCategoryId("cleaning"),
    "Pressure washer for the next clean-up",
    itemMockImages["Pressure washer for the next clean-up"]
  )
  await ensureBooking(
    admin,
    townshipId,
    demoBookingItem,
    aisyah,
    raj,
    new Date(now + 2 * DAY).toISOString().slice(0, 10),
    new Date(now + 5 * DAY).toISOString().slice(0, 10)
  )

  const points = await admin
    .from("points_ledger")
    .select("delta")
    .eq("township_id", townshipId)
    .eq("user_id", aisyah)
  if (points.error) throw new Error(points.error.message)
  const balance = (points.data ?? []).reduce((sum, row: { delta: number }) => sum + row.delta, 0)

  console.log(`Demo data ready. Aisyah balance: ${balance} BP.`)
}

async function ensureEngagementV2DemoData(
  admin: SupabaseClient<Database>,
  townshipId: string,
  userIds: Record<string, string>,
  now: number
) {
  const aisyah = userIds["aisyah@borrowbetter.demo"]
  const raj = userIds["raj@borrowbetter.demo"]
  const currentMonth = new Date(now)
  currentMonth.setDate(1)
  const monthStart = currentMonth.toISOString().slice(0, 10)
  const previousMonth = new Date(currentMonth)
  previousMonth.setMonth(previousMonth.getMonth() - 1)
  const previousStart = previousMonth.toISOString().slice(0, 10)
  const twoMonthsAgo = new Date(previousMonth)
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1)
  const twoMonthsStart = twoMonthsAgo.toISOString().slice(0, 10)

  for (const month of [twoMonthsStart, previousStart, monthStart]) {
    const { error } = await admin.from("streak_months").upsert(
      {
        user_id: aisyah,
        township_id: townshipId,
        month_start: month,
        lend_completed: true,
        borrow_completed: month !== twoMonthsStart,
        is_demo: true,
      },
      { onConflict: "user_id,township_id,month_start" }
    )
    if (error) throw new Error(`Could not seed demo streak month: ${error.message}`)
  }

  const invite = await findOne(admin, "invites", { inviter_id: aisyah })
  if (!invite) {
    const { error } = await admin.from("invites").insert({
      code: "DEMOINVITEA",
      inviter_id: aisyah,
      is_demo: true,
    })
    if (error) throw new Error(`Could not seed demo invite: ${error.message}`)
  }
  const rajInvite = await findOne(admin, "invites", { inviter_id: raj })
  if (!rajInvite) {
    const { error } = await admin.from("invites").insert({
      code: "DEMOINVITER",
      inviter_id: raj,
      is_demo: true,
    })
    if (error) throw new Error(`Could not seed demo inviter code: ${error.message}`)
  }

  const profileUpdate = await admin
    .from("profiles")
    .update({ show_in_highlights: true })
    .eq("id", aisyah)
  if (profileUpdate.error) throw new Error(profileUpdate.error.message)

  const highlight = await findOne(admin, "monthly_highlights", {
    township_id: townshipId,
    month_start: monthStart,
  })
  if (!highlight) {
    const { error } = await admin.from("monthly_highlights").insert({
      township_id: townshipId,
      month_start: monthStart,
      resident_id: aisyah,
      reason: "Lent 12 items in September",
      status: "approved",
      approved_by: raj,
      approved_at: isoAt(now),
      is_demo: true,
    })
    if (error) throw new Error(`Could not seed demo highlight: ${error.message}`)
  }

  const goal = await findOne(admin, "township_goals", {
    township_id: townshipId,
    year: currentMonth.getUTCFullYear(),
  })
  if (!goal) {
    const { error } = await admin.from("township_goals").insert({
      township_id: townshipId,
      year: currentMonth.getUTCFullYear(),
      target_co2e_kg: 5000,
      is_demo: true,
      created_by: raj,
    })
    if (error) throw new Error(`Could not seed demo carbon goal: ${error.message}`)
  }
}

async function ensureAdminIntelligenceDemoData(
  admin: SupabaseClient<Database>,
  townshipId: string,
  userIds: Record<string, string>,
  itemCategoryId: (slug: string) => string
) {
  const existing = await findOne(admin, "shared_library_wishlists", {
    township_id: townshipId,
    normalized_term: "drill",
  })
  if (existing) return
  const { error } = await admin.from("shared_library_wishlists").insert({
    township_id: townshipId,
    category_id: itemCategoryId("home-tools"),
    normalized_term: "drill",
    requested_label: "Cordless drills for the shared library",
    is_demo: true,
    created_by: userIds["office@borrowbetter.demo"],
  })
  if (error) throw new Error(`Could not seed demo wishlist: ${error.message}`)
}

async function ensureSupportDemoData(
  admin: SupabaseClient<Database>,
  townshipId: string,
  userIds: Record<string, string>
) {
  const aisyah = userIds["aisyah@borrowbetter.demo"]
  const raj = userIds["raj@borrowbetter.demo"]
  const office = userIds["office@borrowbetter.demo"]

  const completedBooking = await findOne(admin, "bookings", {
    township_id: townshipId,
    borrower_id: raj,
    lender_id: aisyah,
    status: "completed",
  })
  if (completedBooking) {
    const existingToken = await findOne(admin, "booking_handover_tokens", {
      booking_id: completedBooking.id,
    })
    if (!existingToken) {
      const { error } = await admin.from("booking_handover_tokens").insert({
        booking_id: completedBooking.id,
        jti: "DEMOHANDOVERTOKEN",
        issued_by: aisyah,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        is_demo: true,
      })
      if (error) throw new Error(`Could not seed demo handover token: ${error.message}`)
    }
  }

  const conversation = await findOne(admin, "help_conversations", {
    user_id: aisyah,
    is_demo: true,
  })
  let conversationId = conversation?.id as string | undefined
  if (!conversationId) {
    const { data, error } = await admin
      .from("help_conversations")
      .insert({
        user_id: aisyah,
        township_id: townshipId,
        status: "open",
        is_demo: true,
      })
      .select("id")
      .single()
    if (error || !data) throw new Error(`Could not seed demo help conversation: ${error?.message}`)
    conversationId = data.id as string
    const { error: messageError } = await admin.from("help_messages").insert({
      conversation_id: conversationId,
      user_id: aisyah,
      role: "user",
      content: "How does offline handover work?",
      is_demo: true,
    })
    if (messageError) throw new Error(`Could not seed demo help message: ${messageError.message}`)
  }

  const ticket = await findOne(admin, "support_tickets", {
    requester_id: aisyah,
    is_demo: true,
  })
  if (!ticket) {
    const { error } = await admin.from("support_tickets").insert({
      conversation_id: conversationId,
      township_id: townshipId,
      requester_id: aisyah,
      subject: "Demo question about offline handover",
      status: "open",
      is_demo: true,
    })
    if (error) throw new Error(`Could not seed demo support ticket: ${error.message}`)
  }
}

if (process.argv[1]?.endsWith("seed-demo.ts")) {
  seedDemo().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
