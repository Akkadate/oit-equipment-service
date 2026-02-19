'use client'

import { useEffect, useState } from 'react'
import { flushQueue, getQueue } from '@/lib/offlineQueue'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncedMsg, setSyncedMsg] = useState('')

  useEffect(() => {
    function update() {
      setIsOffline(!navigator.onLine)
      setPendingCount(getQueue().length)
    }
    update()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', update)
    }
  }, [])

  async function handleOnline() {
    setIsOffline(false)
    const count = getQueue().length
    if (count === 0) return
    setSyncing(true)
    const synced = await flushQueue()
    setSyncing(false)
    setPendingCount(getQueue().length)
    if (synced > 0) {
      setSyncedMsg(`✅ ซิงค์ ${synced} รายการแล้ว`)
      setTimeout(() => setSyncedMsg(''), 4000)
    }
  }

  if (!isOffline && pendingCount === 0 && !syncedMsg) return null

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg text-center ${
        isOffline
          ? 'bg-gray-800 text-white'
          : syncing
          ? 'bg-blue-600 text-white'
          : 'bg-green-600 text-white'
      }`}
    >
      {isOffline && (
        <>
          📵 ออฟไลน์อยู่
          {pendingCount > 0 && ` — มี ${pendingCount} รายการรอส่ง`}
        </>
      )}
      {syncing && '🔄 กำลังซิงค์ข้อมูล...'}
      {!isOffline && !syncing && syncedMsg}
    </div>
  )
}
