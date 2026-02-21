'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator'
import { createCompositeQR } from '@/lib/qr-canvas'

interface Campus { id: string; code: string; name: string }
interface Building { id: string; code: string; name: string; campus: Campus }
interface Room {
  id: string
  code: string
  name?: string
  floor?: number
  sort_order?: number
  building: Building
  equipment_count?: number
}

interface Props {
  rooms: Room[]
  buildings: Building[]
}

export function RoomManager({ rooms: initial, buildings }: Props) {
  const [rooms, setRooms] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [buildingId, setBuildingId] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [floor, setFloor] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [loading, setLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)

  function openAdd() {
    setEditing(null)
    setBuildingId(buildings[0]?.id ?? '')
    setCode('')
    setName('')
    setFloor('')
    setSortOrder('')
    setShowForm(true)
  }

  function openEdit(r: Room) {
    setEditing(r)
    setBuildingId(r.building?.id ?? '')
    setCode(r.code)
    setName(r.name ?? '')
    setFloor(r.floor ? String(r.floor) : '')
    setSortOrder(r.sort_order != null ? String(r.sort_order) : '')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editing ? `/api/rooms/${editing.id}` : '/api/rooms'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId, code, name, floor, sortOrder: sortOrder !== '' ? Number(sortOrder) : 99 }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      const saved = await res.json()
      if (editing) {
        setRooms((prev) => prev.map((r) => (r.id === saved.id ? { ...saved, equipment_count: r.equipment_count } : r)))
        toast.success('แก้ไขห้องแล้ว')
      } else {
        setRooms((prev) => [...prev, { ...saved, equipment_count: 0 }])
        toast.success('เพิ่มห้องแล้ว')
      }
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(r: Room) {
    if (!confirm(`ลบห้อง "${r.code}" ใช่ไหม?\n(อุปกรณ์ในห้องนี้จะถูกลบด้วย)`)) return
    const res = await fetch(`/api/rooms/${r.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('ลบไม่สำเร็จ'); return }
    setRooms((prev) => prev.filter((x) => x.id !== r.id))
    toast.success('ลบห้องแล้ว')
  }

  async function handleBatchPrint() {
    if (rooms.length === 0) return
    setBatchLoading(true)
    try {
      // Fetch all QR data URLs in parallel
      const results = await Promise.all(
        rooms.map(async (r) => {
          const res = await fetch(`/api/rooms/${r.id}/qr`)
          const data = await res.json()
          return { room: r, dataUrl: data.dataUrl as string }
        })
      )

      // Create composite images (QR + room text) in parallel
      const composites = await Promise.all(
        results.map(({ room, dataUrl }) =>
          createCompositeQR(dataUrl, room.code, room.building?.name ?? '', room.building?.campus?.name ?? '')
        )
      )

      // Build print HTML — 3 columns on A4
      const items = composites
        .map((src) => `<div class="qr-item"><img src="${src}" alt="QR" /></div>`)
        .join('')

      const win = window.open('', '_blank')
      if (!win) {
        toast.error('ไม่สามารถเปิดหน้าต่างพิมพ์ได้ (กรุณาอนุญาต popup)')
        return
      }

      win.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8" />
  <title>QR Codes ทั้งหมด</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: sans-serif; margin: 0; padding: 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
    .qr-item { break-inside: avoid; text-align: center; }
    .qr-item img { width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="grid">${items}</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body></html>`)
    } catch {
      toast.error('เกิดข้อผิดพลาดระหว่างโหลด QR Code')
    } finally {
      setBatchLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleBatchPrint}
          disabled={batchLoading || rooms.length === 0}
          className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40"
        >
          {batchLoading ? 'กำลังโหลด QR...' : `พิมพ์ QR ทั้งหมด (${rooms.length})`}
        </button>
        <button
          type="button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + เพิ่มห้องเรียน
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-3">
            {editing ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียน'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">อาคาร</label>
              <select
                title="เลือกอาคาร"
                className="border rounded px-3 py-1.5 text-sm w-52"
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
                required
              >
                <option value="">-- เลือกอาคาร --</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.campus?.name} · {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">รหัสห้อง *</label>
              <input
                className="border rounded px-3 py-1.5 text-sm w-28"
                placeholder="เช่น IT301"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชื่อห้อง (ไม่บังคับ)</label>
              <input
                className="border rounded px-3 py-1.5 text-sm w-52"
                placeholder="เช่น ห้องปฏิบัติการคอมพิวเตอร์"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชั้น</label>
              <input
                type="number"
                className="border rounded px-3 py-1.5 text-sm w-16"
                placeholder="3"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ลำดับแสดงผล</label>
              <input
                type="number"
                min="1"
                className="border rounded px-3 py-1.5 text-sm w-20"
                placeholder="99"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm px-4 py-1.5 rounded border hover:bg-gray-50"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">ลำดับ</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ห้อง</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">อาคาร</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">วิทยาเขต</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">อุปกรณ์</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">QR Code</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  ยังไม่มีห้องเรียน
                </td>
              </tr>
            ) : (
              rooms.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center text-xs text-gray-400 tabular-nums">{r.sort_order ?? 99}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.code}</p>
                    {r.name && <p className="text-gray-400 text-xs">{r.name}</p>}
                    {r.floor && <p className="text-gray-400 text-xs">ชั้น {r.floor}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.building?.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.building?.campus?.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.equipment_count ?? 0} รายการ</td>
                  <td className="px-4 py-3">
                    <QRCodeGenerator
                      roomId={r.id}
                      roomCode={r.code}
                      buildingName={r.building?.name ?? ''}
                      campusName={r.building?.campus?.name ?? ''}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                      >
                        ลบ
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
