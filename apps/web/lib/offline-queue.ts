"use client"

export type QueuedHandoverScan = {
  token: string
  bookingId: string
  deviceScannedAt: string
  guideAcknowledged: boolean
}

const DB_NAME = "borrowlah-offline"
const STORE_NAME = "handover-scans"

function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb_unavailable"))
      return
    }
    const request = indexedDB.open(DB_NAME, 2)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "token" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("indexeddb_open_failed"))
  })
}

export async function enqueueHandoverScan(scan: QueuedHandoverScan): Promise<void> {
  const db = await openQueue()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).put(scan)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("queue_write_failed"))
  })
  db.close()
}

export async function getQueuedHandoverScans(): Promise<QueuedHandoverScan[]> {
  const db = await openQueue()
  const scans = await new Promise<QueuedHandoverScan[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result ?? []) as QueuedHandoverScan[])
    request.onerror = () => reject(request.error ?? new Error("queue_read_failed"))
  })
  db.close()
  return scans
}

export async function removeQueuedHandoverScan(token: string): Promise<void> {
  const db = await openQueue()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite")
    transaction.objectStore(STORE_NAME).delete(token)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("queue_delete_failed"))
  })
  db.close()
}

export type CachedGuestPass = {
  pass_id: string
  token_hash: string
  visitor_name: string
  vehicle_plate?: string | null
  valid_from: string
  valid_until: string
  status: string
  effective_status?: string
  is_inside?: boolean
  host_unit?: string | null
  refreshed_at?: string
}

export type QueuedGuestScan = {
  client_event_id: string
  pass_id: string
  direction: "in" | "out"
  gate_id: string
  token?: string
  scanned_at: string
  id_sighted: boolean
  note?: string
  township_id: string
}

const GUEST_CACHE_STORE = "guest-pass-cache"
const GUEST_SCAN_STORE = "guest-scan-queue"

async function openGuestQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb_unavailable"))
      return
    }
    const request = indexedDB.open(DB_NAME, 2)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "token" })
      if (!db.objectStoreNames.contains(GUEST_CACHE_STORE)) db.createObjectStore(GUEST_CACHE_STORE, { keyPath: "pass_id" })
      if (!db.objectStoreNames.contains(GUEST_SCAN_STORE)) db.createObjectStore(GUEST_SCAN_STORE, { keyPath: "client_event_id" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("guest_queue_open_failed"))
  })
}

export async function cacheGuestPasses(passes: CachedGuestPass[]): Promise<void> {
  const db = await openGuestQueue()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(GUEST_CACHE_STORE, "readwrite")
    const store = tx.objectStore(GUEST_CACHE_STORE)
    store.clear()
    for (const pass of passes) store.put({ ...pass, refreshed_at: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("guest_cache_write_failed"))
  })
  db.close()
}

export async function readGuestPassCache(): Promise<CachedGuestPass[]> {
  const db = await openGuestQueue()
  const passes = await new Promise<CachedGuestPass[]>((resolve, reject) => {
    const request = db.transaction(GUEST_CACHE_STORE, "readonly").objectStore(GUEST_CACHE_STORE).getAll()
    request.onsuccess = () => resolve((request.result ?? []) as CachedGuestPass[])
    request.onerror = () => reject(request.error ?? new Error("guest_cache_read_failed"))
  })
  db.close()
  return passes
}

export async function enqueueGuestScan(scan: QueuedGuestScan): Promise<void> {
  const db = await openGuestQueue()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(GUEST_SCAN_STORE, "readwrite")
    tx.objectStore(GUEST_SCAN_STORE).put(scan)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("guest_scan_queue_write_failed"))
  })
  db.close()
}

export async function readQueuedGuestScans(): Promise<QueuedGuestScan[]> {
  const db = await openGuestQueue()
  const scans = await new Promise<QueuedGuestScan[]>((resolve, reject) => {
    const request = db.transaction(GUEST_SCAN_STORE, "readonly").objectStore(GUEST_SCAN_STORE).getAll()
    request.onsuccess = () => resolve((request.result ?? []) as QueuedGuestScan[])
    request.onerror = () => reject(request.error ?? new Error("guest_scan_queue_read_failed"))
  })
  db.close()
  return scans
}

export async function removeQueuedGuestScan(clientEventId: string): Promise<void> {
  const db = await openGuestQueue()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(GUEST_SCAN_STORE, "readwrite")
    tx.objectStore(GUEST_SCAN_STORE).delete(clientEventId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("guest_scan_queue_delete_failed"))
  })
  db.close()
}

export async function wipeGuestOfflineData(): Promise<void> {
  if (typeof indexedDB === "undefined") return
  const db = await openGuestQueue()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([GUEST_CACHE_STORE, GUEST_SCAN_STORE], "readwrite")
    tx.objectStore(GUEST_CACHE_STORE).clear()
    tx.objectStore(GUEST_SCAN_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error ?? new Error("guest_offline_wipe_failed"))
  })
  db.close()
}
