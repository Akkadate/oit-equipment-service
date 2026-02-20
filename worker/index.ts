/// <reference lib="webworker" />

// ── Push event ────────────────────────────────────────────────
// รับ push notification จาก server (web-push VAPID)
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  const data = event.data.json() as {
    title: string
    body: string
    url?: string
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: data.url ?? '/admin/repairs' },
      tag: 'repair-notify',        // overwrite แทน stack ถ้ามาหลายอัน
      renotify: true,
    })
  )
})

// ── Notification click ─────────────────────────────────────────
// คลิก notification → เปิด tab หรือ focus tab ที่เปิดอยู่แล้ว
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url: string = (event.notification.data as { url: string })?.url ?? '/admin/repairs'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes('/admin'))
        if (existing) {
          existing.navigate(url)
          return existing.focus()
        }
        return self.clients.openWindow(url)
      })
  )
})
