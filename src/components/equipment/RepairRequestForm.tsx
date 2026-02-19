'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Equipment } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { enqueueRepair } from '@/lib/offlineQueue'
import { PhotoCapture } from './PhotoCapture'

interface Props {
  equipment: Equipment[]
  roomId: string
}

interface SelectedEquipment {
  id: string
  description: string
  photo_url?: string
}

const LS_KEY = 'oit_reporter'

export function RepairRequestForm({ equipment, roomId }: Props) {
  const [selected, setSelected] = useState<SelectedEquipment[]>([])
  const [reportedBy, setReportedBy] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  // Load saved name/phone from localStorage on first render
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
      if (saved.name) { setReportedBy(saved.name); setPrefilled(true) }
      if (saved.phone) setPhone(saved.phone)
    } catch { /* ignore */ }
  }, [])

  function toggleEquipment(id: string) {
    setSelected((prev) =>
      prev.find((s) => s.id === id)
        ? prev.filter((s) => s.id !== id)
        : [...prev, { id, description: '' }]
    )
  }

  function setDescription(id: string, description: string) {
    setSelected((prev) =>
      prev.map((s) => (s.id === id ? { ...s, description } : s))
    )
  }

  function setPhotoUrl(id: string, photo_url: string) {
    setSelected((prev) =>
      prev.map((s) => (s.id === id ? { ...s, photo_url } : s))
    )
  }

  function isSelected(id: string) {
    return selected.some((s) => s.id === id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.length === 0) {
      toast.error('กรุณาเลือกอุปกรณ์ที่มีปัญหาอย่างน้อย 1 รายการ')
      return
    }
    if (!reportedBy.trim()) {
      toast.error('กรุณากรอกชื่อผู้แจ้ง')
      return
    }
    const hasEmptyDesc = selected.some((s) => !s.description.trim())
    if (hasEmptyDesc) {
      toast.error('กรุณากรอกรายละเอียดปัญหาสำหรับทุกอุปกรณ์ที่เลือก')
      return
    }

    setSubmitting(true)

    // Save reporter info to localStorage for next time
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ name: reportedBy.trim(), phone: phone.trim() }))
    } catch { /* ignore */ }

    // ออฟไลน์ → บันทึกลง queue แล้ว sync ทีหลัง
    if (!navigator.onLine) {
      selected.forEach((s) => {
        enqueueRepair({
          equipment_id: s.id,
          room_id: roomId,
          reported_by: reportedBy.trim(),
          reporter_phone: phone.trim() || undefined,
          description: s.description.trim(),
          photo_url: s.photo_url || undefined,
        })
      })
      setSubmitting(false)
      setSubmitted(true)
      toast.warning(`บันทึกไว้ ${selected.length} รายการ — จะส่งอัตโนมัติเมื่อมีสัญญาณ`)
      return
    }

    try {
      const results = await Promise.all(
        selected.map((s) =>
          fetch('/api/repairs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              equipment_id: s.id,
              room_id: roomId,
              reported_by: reportedBy.trim(),
              reporter_phone: phone.trim() || undefined,
              description: s.description.trim(),
              photo_url: s.photo_url || undefined,
            }),
          })
        )
      )
      const hasError = results.some((r) => !r.ok)
      if (hasError) {
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
        return
      }
      setSubmitted(true)
      toast.success(`แจ้งซ่อม ${selected.length} รายการ เรียบร้อยแล้ว`)
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-4">🔧</p>
        <h2 className="text-xl font-bold text-gray-800">แจ้งซ่อมเรียบร้อยแล้ว</h2>
        <p className="text-gray-500 text-sm mt-2">
          เจ้าหน้าที่จะดำเนินการโดยเร็วที่สุด
        </p>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setSelected([]); setReportedBy(''); setPhone('') }}
          className="mt-4 text-blue-600 text-sm hover:underline"
        >
          แจ้งซ่อมอีกครั้ง
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Equipment selection */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          เลือกอุปกรณ์ที่มีปัญหา <span className="text-red-500">*</span>
        </p>
        {equipment.map((eq: any) => (
          <div key={eq.id} className="space-y-2">
            <button
              type="button"
              onClick={() => toggleEquipment(eq.id)}
              className={`w-full text-left border rounded-lg px-3 py-2.5 transition-all ${
                isSelected(eq.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[10px] ${
                      isSelected(eq.id)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected(eq.id) && '✓'}
                  </span>
                  <span className="font-medium text-gray-900 text-sm truncate">{eq.name}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono flex-shrink-0">{eq.asset_code}</span>
              </div>
            </button>

            {isSelected(eq.id) && (
              <div className="ml-4 space-y-2">
                <Textarea
                  placeholder={`รายละเอียดปัญหาของ ${eq.name}...`}
                  value={selected.find((s) => s.id === eq.id)?.description ?? ''}
                  onChange={(e) => setDescription(eq.id, e.target.value)}
                  className="text-sm h-20 resize-none"
                  required
                />
                <PhotoCapture
                  equipmentId={eq.id}
                  uploadUrl="/api/repairs/upload"
                  onUploaded={(url) => setPhotoUrl(eq.id, url)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reporter info */}
      <div className="space-y-4 bg-gray-50 rounded-xl p-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="reported_by">
              ชื่อผู้แจ้ง <span className="text-red-500">*</span>
            </Label>
            {prefilled && (
              <span className="text-[11px] text-blue-500">
                ✓ จำชื่อไว้ให้แล้ว
              </span>
            )}
          </div>
          <Input
            id="reported_by"
            placeholder="ชื่อ-นามสกุล หรือ รหัสพนักงาน"
            value={reportedBy}
            onChange={(e) => { setReportedBy(e.target.value); setPrefilled(false) }}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting || selected.length === 0}
        className="w-full"
        size="lg"
      >
        {submitting
          ? 'กำลังส่ง...'
          : `แจ้งซ่อม ${selected.length > 0 ? `(${selected.length} รายการ)` : ''}`}
      </Button>
    </form>
  )
}
