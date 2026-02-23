'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Equipment } from '@/types'
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

    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ name: reportedBy.trim(), phone: phone.trim() }))
    } catch { /* ignore */ }

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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5 shadow-sm">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">แจ้งซ่อมเรียบร้อยแล้ว</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">
          เจ้าหน้าที่ได้รับแจ้งแล้ว และจะดำเนินการโดยเร็วที่สุด
        </p>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setSelected([]) }}
          className="mt-8 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-6 py-3 rounded-xl transition-colors"
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
        <p className="text-sm font-semibold text-gray-700">
          เลือกอุปกรณ์ที่มีปัญหา <span className="text-red-500">*</span>
        </p>
        <p className="text-xs text-gray-400">สามารถเลือกได้หลายรายการ</p>
        <div className="space-y-2.5 mt-2">
          {equipment.map((eq: any) => (
            <div key={eq.id} className="space-y-2.5">
              <button
                type="button"
                onClick={() => toggleEquipment(eq.id)}
                className={`w-full text-left border-2 rounded-xl px-4 py-4 transition-all active:scale-[0.99] ${
                  isSelected(eq.id)
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors ${
                      isSelected(eq.id)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected(eq.id) && '✓'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{eq.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{eq.asset_code}</p>
                  </div>
                </div>
              </button>

              {isSelected(eq.id) && (
                <div className="ml-2 pl-4 border-l-2 border-blue-200 space-y-2.5">
                  <Textarea
                    placeholder={`อธิบายปัญหาของ ${eq.name}...`}
                    value={selected.find((s) => s.id === eq.id)?.description ?? ''}
                    onChange={(e) => setDescription(eq.id, e.target.value)}
                    className="text-sm h-24 resize-none rounded-xl"
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
      </div>

      {/* Reporter info */}
      <div className="space-y-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ข้อมูลผู้แจ้ง</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="reported_by" className="text-sm font-medium">
              ชื่อผู้แจ้ง <span className="text-red-500">*</span>
            </Label>
            {prefilled && (
              <span className="text-[11px] text-blue-500 font-medium">✓ จำชื่อไว้ให้แล้ว</span>
            )}
          </div>
          <Input
            id="reported_by"
            placeholder="ชื่อ-นามสกุล หรือ รหัสพนักงาน"
            value={reportedBy}
            onChange={(e) => { setReportedBy(e.target.value); setPrefilled(false) }}
            required
            className="h-12 rounded-xl text-base"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">เบอร์โทรศัพท์</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12 rounded-xl text-base"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || selected.length === 0}
        className={`w-full py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.99] shadow-sm ${
          selected.length === 0 || submitting
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-200'
        }`}
      >
        {submitting
          ? 'กำลังส่ง...'
          : selected.length > 0
            ? `ส่งแจ้งซ่อม ${selected.length} รายการ`
            : 'เลือกอุปกรณ์ที่มีปัญหาก่อน'}
      </button>
    </form>
  )
}
