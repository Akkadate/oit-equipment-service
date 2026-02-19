'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Equipment, EquipmentStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PhotoCapture } from './PhotoCapture'

interface InspectionRow {
  equipment_id: string
  status: EquipmentStatus | null
  comment: string
  photo_url?: string
}

interface Props {
  equipment: Equipment[]
  roomId: string
  token: string
}

const STATUS_OPTIONS: { value: EquipmentStatus; label: string; color: string }[] = [
  { value: 'normal', label: '✅ ปกติ', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'damaged', label: '⚠️ ชำรุด', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'pending_replacement', label: '🔴 รอเปลี่ยน', color: 'bg-red-100 text-red-800 border-red-300' },
]

function initialStatus(latest: EquipmentStatus | undefined | null): EquipmentStatus | null {
  // Keep damaged/pending_replacement as default so staff can see the known issue.
  // For normal or unchecked, leave blank — staff must confirm themselves.
  if (latest === 'damaged' || latest === 'pending_replacement') return latest
  return null
}

export function InspectionForm({ equipment, roomId, token }: Props) {
  const [rows, setRows] = useState<InspectionRow[]>(
    equipment.map((eq) => ({
      equipment_id: eq.id,
      status: initialStatus(eq.latest_status),
      comment: '',
    }))
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function setStatus(equipmentId: string, status: EquipmentStatus) {
    setRows((prev) =>
      prev.map((r) => (r.equipment_id === equipmentId ? { ...r, status } : r))
    )
  }

  function setComment(equipmentId: string, comment: string) {
    setRows((prev) =>
      prev.map((r) => (r.equipment_id === equipmentId ? { ...r, comment } : r))
    )
  }

  function setPhotoUrl(equipmentId: string, photo_url: string) {
    setRows((prev) =>
      prev.map((r) => (r.equipment_id === equipmentId ? { ...r, photo_url } : r))
    )
  }

  const checkedRows = rows.filter((r) => r.status !== null)

  async function handleSubmit() {
    if (checkedRows.length === 0) {
      toast.error('กรุณาเลือกสถานะอย่างน้อย 1 รายการ')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, inspections: checkedRows }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      setSubmitted(true)
      toast.success('บันทึกผลตรวจสอบเรียบร้อยแล้ว')
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">✅</p>
        <h2 className="text-xl font-bold text-gray-800">บันทึกเรียบร้อยแล้ว</h2>
        <p className="text-gray-500 text-sm mt-2">ผลการตรวจสอบถูกบันทึกในระบบแล้ว</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-blue-600 text-sm hover:underline"
        >
          ตรวจสอบอีกครั้ง
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {equipment.map((eq, i) => {
        const row = rows[i]
        return (
          <div key={eq.id} className="bg-white border rounded-xl p-4 space-y-3">
            {/* Equipment info */}
            <div>
              <p className="font-medium text-gray-900">{eq.name}</p>
              <p className="text-xs text-gray-400 font-mono">{eq.asset_code}</p>
              {(eq as any).equipment_type && (
                <p className="text-xs text-gray-500">{(eq as any).equipment_type.name}</p>
              )}
            </div>

            {/* Status selector */}
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(eq.id, opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    row.status === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {row.status === null && (
                <span className="text-xs text-gray-300 self-center">— ยังไม่เลือก</span>
              )}
            </div>

            {/* Comment + Photo — show whenever a status is selected */}
            {row.status !== null && (
              <>
                <Textarea
                  placeholder="หมายเหตุ (ถ้ามี)..."
                  value={row.comment}
                  onChange={(e) => setComment(eq.id, e.target.value)}
                  className="text-sm h-16 resize-none"
                />
                <PhotoCapture
                  equipmentId={eq.id}
                  onUploaded={(url) => setPhotoUrl(eq.id, url)}
                />
              </>
            )}
          </div>
        )
      })}

      <Button
        onClick={handleSubmit}
        disabled={submitting || checkedRows.length === 0}
        className="w-full"
        size="lg"
      >
        {submitting
          ? 'กำลังบันทึก...'
          : `บันทึกผลตรวจสอบ (${checkedRows.length} / ${equipment.length} รายการ)`}
      </Button>
    </div>
  )
}
