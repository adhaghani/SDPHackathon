"use client"

export type QueuedHandoverScan = {
  token: string
  bookingId: string
  deviceScannedAt: string
  guideAcknowledged: boolean
}

const DB_NAME = "borrowbetter-offline"
const STORE_NAME = "handover-scans"

function openQueue(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb_unavailable"))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
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
