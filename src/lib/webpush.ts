import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase'

// ตั้งค่า VAPID ครั้งเดียวตอน module load
// สร้าง VAPID keys ด้วย: npx web-push generate-vapid-keys
webpush.setVapidDetails(
  process.env.VAPID_EMAIL ?? 'mailto:mis.admin@northbkk.ac.th',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
  title: string
  body: string
  url?: string
}

/**
 * ส่ง push notification ไปยัง admin/staff ทุกคนที่ subscribe ไว้
 * ใช้ Promise.allSettled เพื่อไม่ให้ subscription ที่หมดอายุทำให้ล้มเลิกทั้งหมด
 */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  const supabase = createServiceClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')

  if (!subs?.length) return

  const payloadStr = JSON.stringify(payload)

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payloadStr,
      )
    )
  )

  // ลบ subscription ที่ browser ยกเลิกไปแล้ว (410 Gone)
  const expiredEndpoints = subs
    .filter((_, i) => {
      const r = results[i]
      return r.status === 'rejected' && (r.reason as any)?.statusCode === 410
    })
    .map((s) => s.endpoint)

  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints)
  }
}
