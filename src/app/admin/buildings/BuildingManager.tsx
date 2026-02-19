'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Campus { id: string; code: string; name: string }
interface Building { id: string; code: string; name: string; campus: Campus }

interface Props {
  buildings: Building[]
  campuses: Campus[]
}

export function BuildingManager({ buildings: initial, campuses }: Props) {
  const [buildings, setBuildings] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Building | null>(null)
  const [campusId, setCampusId] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  function openAdd() {
    setEditing(null)
    setCampusId(campuses[0]?.id ?? '')
    setCode('')
    setName('')
    setShowForm(true)
  }

  function openEdit(b: Building) {
    setEditing(b)
    setCampusId(b.campus?.id ?? '')
    setCode(b.code)
    setName(b.name)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editing ? `/api/buildings/${editing.id}` : '/api/buildings'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId, code, name }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      const saved = await res.json()
      if (editing) {
        setBuildings((prev) => prev.map((b) => (b.id === saved.id ? saved : b)))
        toast.success('แก้ไขอาคารแล้ว')
      } else {
        setBuildings((prev) => [...prev, saved])
        toast.success('เพิ่มอาคารแล้ว')
      }
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(b: Building) {
    if (!confirm(`ลบอาคาร "${b.name}" ใช่ไหม?\n(ห้องในอาคารนี้จะถูกลบด้วย)`)) return
    const res = await fetch(`/api/buildings/${b.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('ลบไม่สำเร็จ'); return }
    setBuildings((prev) => prev.filter((x) => x.id !== b.id))
    toast.success('ลบอาคารแล้ว')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + เพิ่มอาคาร
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-3">
            {editing ? 'แก้ไขอาคาร' : 'เพิ่มอาคาร'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">วิทยาเขต</label>
              <select
                className="border rounded px-3 py-1.5 text-sm w-52"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                required
              >
                <option value="">-- เลือกวิทยาเขต --</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">รหัสอาคาร</label>
              <input
                className="border rounded px-3 py-1.5 text-sm w-24"
                placeholder="เช่น A, IT"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชื่ออาคาร</label>
              <input
                className="border rounded px-3 py-1.5 text-sm w-52"
                placeholder="เช่น อาคารเทคโนโลยีสารสนเทศ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
              <th className="px-4 py-3 text-left font-medium text-gray-600">รหัส</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ชื่ออาคาร</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">วิทยาเขต</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {buildings.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  ยังไม่มีอาคาร
                </td>
              </tr>
            ) : (
              buildings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.code}</td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{b.campus?.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(b)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
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
