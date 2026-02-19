// Offline queue ใช้ localStorage (เรียบง่าย, รองรับ iOS ด้วย)
// ถ้าต้องการ IndexedDB เต็มรูปแบบ ใช้ idb-keyval แทน

export interface QueuedRepair {
  id: string
  endpoint: string
  body: object
  createdAt: number
}

const QUEUE_KEY = 'oit_offline_repairs'

export function enqueueRepair(body: object): void {
  const queue = getQueue()
  queue.push({
    id: crypto.randomUUID(),
    endpoint: '/api/repairs',
    body,
    createdAt: Date.now(),
  })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueue(): QueuedRepair[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function flushQueue(): Promise<number> {
  const queue = getQueue()
  if (queue.length === 0) return 0

  let synced = 0
  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body),
      })
      if (res.ok) {
        removeFromQueue(item.id)
        synced++
      }
    } catch {
      // ยังออฟไลน์อยู่ ข้ามไป
    }
  }
  return synced
}
