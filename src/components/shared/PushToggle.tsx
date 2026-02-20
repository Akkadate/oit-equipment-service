'use client'

import { useEffect, useState } from 'react'

type State = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

export function PushToggle() {
  const [state, setState] = useState<State>('loading')

  // ตรวจสอบสถานะ subscription ปัจจุบัน
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'unsubscribed')
      })
    })
  }, [])

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      })
      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      })
      setState('subscribed')
    } catch {
      // ผู้ใช้กด block หรือเกิดข้อผิดพลาด
      if (Notification.permission === 'denied') setState('denied')
    }
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setState('unsubscribed')
  }

  async function handleClick() {
    if (state === 'subscribed') return unsubscribe()
    if (state === 'unsubscribed') {
      // ขอ permission ถ้ายังไม่ได้ให้
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission()
        if (result !== 'granted') { setState('denied'); return }
      }
      return subscribe()
    }
  }

  if (state === 'loading' || state === 'unsupported' || !VAPID_PUBLIC_KEY) return null

  const isDenied = state === 'denied'
  const isOn = state === 'subscribed'

  return (
    <button
      type="button"
      onClick={isDenied ? undefined : handleClick}
      title={
        isDenied
          ? 'การแจ้งเตือนถูกบล็อก — เปิดใน settings ของ browser'
          : isOn
          ? 'เปิดรับแจ้งเตือนอยู่ — คลิกเพื่อปิด'
          : 'คลิกเพื่อรับแจ้งเตือนเมื่อมีแจ้งซ่อม'
      }
      className={`relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        isDenied
          ? 'text-gray-300 cursor-not-allowed'
          : isOn
          ? 'text-blue-600 hover:bg-blue-50'
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {/* Bell icon */}
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
        {isOn ? (
          // Bell filled
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-1.732-1h3.464A2 2 0 0110 18z" />
        ) : (
          // Bell outline
          <path
            fillRule="evenodd"
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-1.732-1h3.464A2 2 0 0110 18z"
            clipRule="evenodd"
            opacity="0.5"
          />
        )}
      </svg>

      {/* Active indicator dot */}
      {isOn && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}
    </button>
  )
}
