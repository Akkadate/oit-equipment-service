'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { RepairStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { repairStatusLabel } from '@/lib/equipment'

interface Props {
  repairId: string
  currentStatus: RepairStatus
}

const NEXT_STATUS: Partial<Record<RepairStatus, RepairStatus>> = {
  pending: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
}

export function RepairStatusUpdater({ repairId, currentStatus }: Props) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNote, setShowNote] = useState(false)
  const router = useRouter()

  const nextStatus = NEXT_STATUS[currentStatus]
  if (!nextStatus) return null

  async function updateStatus() {
    setLoading(true)
    try {
      const res = await fetch(`/api/repairs/${repairId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          resolved_note: note || undefined,
        }),
      })
      if (!res.ok) {
        toast.error('เกิดข้อผิดพลาด')
        return
      }
      toast.success(`อัปเดตสถานะเป็น "${repairStatusLabel[nextStatus!]}" แล้ว`)
      router.refresh()
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setLoading(false)
      setShowNote(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 flex-shrink-0">
      {showNote && (nextStatus === 'resolved' || nextStatus === 'closed') ? (
        <div className="space-y-2 w-48">
          <Textarea
            placeholder="บันทึกการซ่อม..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="text-xs h-16 resize-none"
          />
          <div className="flex gap-1">
            <Button size="sm" onClick={updateStatus} disabled={loading} className="flex-1 text-xs">
              {loading ? '...' : 'ยืนยัน'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNote(false)} className="text-xs">
              ยกเลิก
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (nextStatus === 'resolved' || nextStatus === 'closed') {
              setShowNote(true)
            } else {
              updateStatus()
            }
          }}
          disabled={loading}
          className="text-xs whitespace-nowrap"
        >
          → {repairStatusLabel[nextStatus]}
        </Button>
      )}
    </div>
  )
}
