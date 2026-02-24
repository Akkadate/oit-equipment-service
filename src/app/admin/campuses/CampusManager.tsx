'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'

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

  const [deleteTarget, setDeleteTarget] = useState<Campus | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  async function executeDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/campuses/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('ลบไม่สำเร็จ'); return }
      setCampuses((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      toast.success('ลบวิทยาเขตแล้ว')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">ยืนยันการลบวิทยาเขต</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>คุณต้องการลบวิทยาเขตนี้ออกจากระบบใช่ไหม?</p>
                <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-900">{deleteTarget?.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{deleteTarget?.code}</p>
                </div>
                <p className="text-red-600 text-xs">⚠️ อาคารและห้องทั้งหมดในวิทยาเขตนี้จะถูกลบด้วย</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              {deleting ? 'กำลังลบ...' : 'ลบถาวร'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet drawer — add / edit */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="right" className="w-full sm:max-w-md px-6 pb-8">
          <SheetHeader className="px-0 pb-2 mb-4">
            <SheetTitle>{editing ? 'แก้ไขวิทยาเขต' : 'เพิ่มวิทยาเขต'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัส (code)</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น NBU-NORTH"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อวิทยาเขต</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น วิทยาเขตนอร์ทกรุงเทพ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ลำดับแสดง</label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="99"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 text-sm py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + เพิ่มวิทยาเขต
        </button>
      </div>

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
                      <button type="button"
                        onClick={() => openEdit(c)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                      <button type="button"
                        onClick={() => setDeleteTarget(c)}
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
