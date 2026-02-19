'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface EquipmentType {
  id: number
  name: string
}

interface Props {
  types: EquipmentType[]
}

export function EquipmentTypeManager({ types: initial }: Props) {
  const [types, setTypes] = useState<EquipmentType[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EquipmentType | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  function openAdd() {
    setEditing(null)
    setName('')
    setShowForm(true)
  }

  function openEdit(t: EquipmentType) {
    setEditing(t)
    setName(t.name)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editing ? `/api/equipment-types/${editing.id}` : '/api/equipment-types'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      const saved = await res.json()
      if (editing) {
        setTypes((prev) => prev.map((t) => (t.id === saved.id ? saved : t)))
        toast.success('แก้ไขประเภทอุปกรณ์แล้ว')
      } else {
        setTypes((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name, 'th')))
        toast.success('เพิ่มประเภทอุปกรณ์แล้ว')
      }
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(t: EquipmentType) {
    if (!confirm(`ลบประเภท "${t.name}" ใช่ไหม?\n(อุปกรณ์ที่ใช้ประเภทนี้จะไม่สามารถลบได้ถ้ายังมีข้อมูล)`)) return
    const res = await fetch(`/api/equipment-types/${t.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? 'ลบไม่สำเร็จ')
      return
    }
    setTypes((prev) => prev.filter((x) => x.id !== t.id))
    toast.success('ลบประเภทอุปกรณ์แล้ว')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + เพิ่มประเภทอุปกรณ์
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-3">
            {editing ? 'แก้ไขประเภทอุปกรณ์' : 'เพิ่มประเภทอุปกรณ์'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชื่อประเภท</label>
              <input
                className="border rounded px-3 py-1.5 text-sm w-72"
                placeholder="เช่น โปรเจกเตอร์, แอร์, คอมพิวเตอร์"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
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
              <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ชื่อประเภทอุปกรณ์</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {types.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  ยังไม่มีประเภทอุปกรณ์
                </td>
              </tr>
            ) : (
              types.map((t, i) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
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
