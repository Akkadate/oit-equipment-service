'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface Campus {
  id: string
  code: string
  name: string
  sort_order: number
}

interface Props {
  campuses: Campus[]
}

export function CampusManager({ campuses: initial }: Props) {
  const [campuses, setCampuses] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Campus | null>(null)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('99')
  const [loading, setLoading] = useState(false)

  function openAdd() {
    setEditing(null)
    setCode('')
    setName('')
    setSortOrder('99')
    setShowForm(true)
  }

  function openEdit(c: Campus) {
    setEditing(c)
    setCode(c.code)
    setName(c.name)
    setSortOrder(String(c.sort_order ?? 99))
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editing ? `/api/campuses/${editing.id}` : '/api/campuses'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, sort_order: Number(sortOrder) || 99 }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      const saved = await res.json()
      if (editing) {
        setCampuses((prev) =>
          prev
            .map((c) => (c.id === saved.id ? saved : c))
            .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
        )
        toast.success('แก้ไขวิทยาเขตแล้ว')
      } else {
        setCampuses((prev) =>
          [...prev, saved].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
        )
        toast.success('เพิ่มวิทยาเขตแล้ว')
      }
      setShowForm(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(c: Campus) {
    if (!confirm(`ลบวิทยาเขต "${c.name}" ใช่ไหม?\n(อาคารและห้องในวิทยาเขตนี้จะถูกลบด้วย)`)) return
    const res = await fetch(`/api/campuses/${c.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('ลบไม่สำเร็จ')
      return
    }
    setCampuses((prev) => prev.filter((x) => x.id !== c.id))
    toast.success('ลบวิทยาเขตแล้ว')
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + เพิ่มวิทยาเขต
        </button>
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-3">
            {editing ? 'แก้ไขวิทยาเขต' : 'เพิ่มวิทยาเขต'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">รหัส (code)</label>
              <input
                className="border rounded px-3 py-1.5 text-sm w-36"
                placeholder="เช่น NBK-NORTH"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ชื่อวิทยาเขต</label>
              <input
                className="border rounded px-3 py-1.5 text-sm w-64"
                placeholder="เช่น วิทยาเขตนอร์ทกรุงเทพ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ลำดับแสดง</label>
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
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-16">ลำดับ</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">รหัส</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ชื่อวิทยาเขต</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {campuses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  ยังไม่มีวิทยาเขต
                </td>
              </tr>
            ) : (
              campuses.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs">{c.sort_order ?? 99}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
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
