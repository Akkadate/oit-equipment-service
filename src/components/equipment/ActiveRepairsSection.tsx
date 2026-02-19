'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { repairStatusColor, repairStatusLabel } from '@/lib/equipment'

interface ActiveRepair {
  id: string
  status: 'pending' | 'in_progress'
  description: string
  reported_by: string
  reporter_phone?: string
  created_at: string
  equipment?: { id: string; name: string }
}

interface Props {
  repairs: ActiveRepair[]
}

function shortDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return 'วันนี้'
  if (days === 1) return 'เมื่อวาน'
  if (days < 7) return `${days} วันก่อน`
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export function ActiveRepairsSection({ repairs: initial }: Props) {
  const [repairs, setRepairs] = useState<ActiveRepair[]>(initial)
  const [staffName, setStaffName] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setStaffName(data.user.user_metadata?.full_name || data.user.email || '')
      }
    })
  }, [])

  if (repairs.length === 0) return null

  async function updateRepair(id: string, newStatus: string, note?: string) {
    setLoading(id)
    try {
      const res = await fetch(`/api/repairs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolved_by: staffName || undefined,
          resolved_note: note || undefined,
        }),
      })
      if (!res.ok) {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        return
      }
      if (newStatus === 'resolved') {
        setRepairs((prev) => prev.filter((r) => r.id !== id))
        toast.success('ปิดงานซ่อมเรียบร้อยแล้ว')
      } else {
        setRepairs((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus as 'in_progress' } : r))
        )
        toast.success('รับงานซ่อมแล้ว')
      }
      setShowNoteFor(null)
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">🔧 แจ้งซ่อมค้างอยู่</span>
        <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          {repairs.length}
        </span>
      </div>

      <div className="space-y-3">
        {repairs.map((r) => (
          <div
            key={r.id}
            className="bg-white border border-orange-100 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {/* Status + equipment name */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${repairStatusColor[r.status]}`}
                  >
                    {repairStatusLabel[r.status]}
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {r.equipment?.name}
                  </span>
                </div>
                {/* Description */}
                <p className="text-sm text-gray-600">{r.description}</p>
                {/* Reporter */}
                <p className="text-xs text-gray-400 mt-1">
                  แจ้งโดย {r.reported_by}
                  {r.reporter_phone && ` · ${r.reporter_phone}`}
                  {' · '}
                  {shortDate(r.created_at)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0">
                {r.status === 'pending' && (
                  <button
                    type="button"
                    disabled={loading === r.id}
                    onClick={() => updateRepair(r.id, 'in_progress')}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 whitespace-nowrap transition-colors"
                  >
                    {loading === r.id ? '...' : 'รับงาน →'}
                  </button>
                )}
                {r.status === 'in_progress' && showNoteFor !== r.id && (
                  <button
                    type="button"
                    onClick={() => setShowNoteFor(r.id)}
                    className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg whitespace-nowrap transition-colors"
                  >
                    แก้ไขแล้ว ✓
                  </button>
                )}
              </div>
            </div>

            {/* Resolve note input */}
            {showNoteFor === r.id && (
              <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                <textarea
                  placeholder="บันทึกการซ่อม เช่น เปลี่ยนหลอดไฟใหม่ / ล้างแอร์ (ถ้ามี)..."
                  value={noteMap[r.id] ?? ''}
                  onChange={(e) =>
                    setNoteMap((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {staffName && (
                  <p className="text-xs text-gray-400">
                    บันทึกโดย: <span className="font-medium text-gray-600">{staffName}</span>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading === r.id}
                    onClick={() => updateRepair(r.id, 'resolved', noteMap[r.id])}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {loading === r.id ? 'กำลังบันทึก...' : 'ยืนยันปิดงาน'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNoteFor(null)}
                    className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-200 mt-5 mb-1" />
    </div>
  )
}
