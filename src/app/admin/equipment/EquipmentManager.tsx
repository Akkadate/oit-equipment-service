'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  types: { id: number; name: string }[]
  rooms: any[]
  equipment: any[]
}

const emptyForm = {
  room_id: '',
  type_id: '',
  name: '',
  asset_code: '',
  serial_number: '',
  installed_at: '',
  note: '',
}

export function EquipmentManager({ types, rooms, equipment: initial }: Props) {
  const [items, setItems] = useState<any[]>(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(eq: any) {
    setEditing(eq)
    setForm({
      room_id: eq.room?.id ?? '',
      type_id: String(eq.equipment_type?.id ?? ''),
      name: eq.name ?? '',
      asset_code: eq.asset_code ?? '',
      serial_number: eq.serial_number ?? '',
      installed_at: eq.installed_at ?? '',
      note: eq.note ?? '',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.room_id || !form.type_id || !form.name || !form.asset_code) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น')
      return
    }
    setSaving(true)
    try {
      const payload = {
        room_id: form.room_id,
        type_id: parseInt(form.type_id),
        name: form.name,
        asset_code: form.asset_code,
        serial_number: form.serial_number || null,
        installed_at: form.installed_at || null,
        note: form.note || null,
      }
      const url = editing ? `/api/equipment/${editing.id}` : '/api/equipment'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'เกิดข้อผิดพลาด')
        return
      }

      // Re-fetch to get updated relations (room, equipment_type)
      const listRes = await fetch('/api/equipment')
      if (listRes.ok) setItems(await listRes.json())

      toast.success(editing ? 'แก้ไขอุปกรณ์แล้ว' : 'เพิ่มอุปกรณ์เรียบร้อยแล้ว')
      setOpen(false)
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setSaving(false)
    }
  }

  async function handleRetire(eq: any) {
    if (!confirm(`จำหน่ายออก "${eq.name}" (${eq.asset_code}) ใช่ไหม?\nอุปกรณ์จะถูกบันทึกว่าจำหน่ายออกและซ่อนจากรายการปกติ`)) return
    const res = await fetch(`/api/equipment/${eq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retired_at: new Date().toISOString() }),
    })
    if (!res.ok) {
      toast.error('จำหน่ายออกไม่สำเร็จ')
      return
    }
    setItems((prev) => prev.filter((x) => x.id !== eq.id))
    toast.success(`จำหน่ายออก "${eq.name}" แล้ว`)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openAdd}>+ เพิ่มอุปกรณ์</Button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editing ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>ห้อง <span className="text-red-500">*</span></Label>
                  <Select value={form.room_id} onValueChange={(v) => set('room_id', v)}>
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
                  <Select value={form.type_id} onValueChange={(v) => set('type_id', v)}>
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
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ชื่ออุปกรณ์</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">รหัส</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ประเภท</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ห้อง</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Serial</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ติดตั้ง</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  ยังไม่มีอุปกรณ์
                </td>
              </tr>
            ) : (
              items.map((eq: any) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{eq.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{eq.asset_code}</td>
                  <td className="px-4 py-3 text-gray-500">{eq.equipment_type?.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {eq.room?.building?.name} · {eq.room?.code}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                    {eq.serial_number ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {eq.installed_at
                      ? new Date(eq.installed_at).toLocaleDateString('th-TH')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(eq)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRetire(eq)}
                        className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1 border border-orange-200 rounded hover:bg-orange-50"
                      >
                        จำหน่ายออก
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
