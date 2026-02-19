'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  types: { id: number; name: string }[]
  rooms: any[]
}

export function EquipmentManager({ types, rooms }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    room_id: '',
    type_id: '',
    name: '',
    asset_code: '',
    serial_number: '',
    installed_at: '',
    note: '',
  })
  const router = useRouter()

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.room_id || !form.type_id || !form.name || !form.asset_code) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type_id: parseInt(form.type_id),
          installed_at: form.installed_at || undefined,
          serial_number: form.serial_number || undefined,
          note: form.note || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      toast.success('เพิ่มอุปกรณ์เรียบร้อยแล้ว')
      setOpen(false)
      setForm({ room_id: '', type_id: '', name: '', asset_code: '', serial_number: '', installed_at: '', note: '' })
      router.refresh()
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>+ เพิ่มอุปกรณ์</Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">เพิ่มอุปกรณ์ใหม่</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ห้อง <span className="text-red-500">*</span></Label>
              <Select onValueChange={(v) => set('room_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกห้อง" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.building?.code} · {r.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ประเภท <span className="text-red-500">*</span></Label>
              <Select onValueChange={(v) => set('type_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภทอุปกรณ์" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>ชื่ออุปกรณ์ <span className="text-red-500">*</span></Label>
            <Input
              placeholder="เช่น โปรเจกเตอร์ EPSON EB-X51"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>รหัสอุปกรณ์ <span className="text-red-500">*</span></Label>
              <Input
                placeholder="NBK-PJ-0001"
                value={form.asset_code}
                onChange={(e) => set('asset_code', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Serial Number</Label>
              <Input
                placeholder="SN-XXXXX"
                value={form.serial_number}
                onChange={(e) => set('serial_number', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>วันที่ติดตั้ง</Label>
            <Input
              type="date"
              value={form.installed_at}
              onChange={(e) => set('installed_at', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>หมายเหตุ</Label>
            <Textarea
              placeholder="ข้อมูลเพิ่มเติม..."
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              className="h-16 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
