/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope

// ── Push event ────────────────────────────────────────────────
// รับ push notification จาก server (web-push VAPID)
sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  const data = event.data.json() as {
    title: string
    body: string
    url?: string
  }

  event.waitUntil(
    sw.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: data.url ?? '/admin/repairs' },
      tag: 'repair-notify',
      renotify: true,
    })
  )
})

// ── Notification click ─────────────────────────────────────────
// คลิก notification → เปิด tab หรือ focus tab ที่เปิดอยู่แล้ว
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url: string = (event.notification.data as { url: string })?.url ?? '/admin/repairs'

  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes('/admin'))
        if (existing) {
          existing.navigate(url)
          return existing.focus()
        }
        return sw.clients.openWindow(url)
      })
  )
})
