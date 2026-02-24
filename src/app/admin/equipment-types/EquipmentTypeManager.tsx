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

  const [deleteTarget, setDeleteTarget] = useState<EquipmentType | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  async function executeDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/equipment-types/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'ลบไม่สำเร็จ')
        return
      }
      setTypes((prev) => prev.filter((x) => x.id !== deleteTarget.id))
      toast.success('ลบประเภทอุปกรณ์แล้ว')
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
            <AlertDialogTitle className="text-red-600">ยืนยันการลบประเภทอุปกรณ์</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>คุณต้องการลบประเภทอุปกรณ์นี้ออกจากระบบใช่ไหม?</p>
                <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-900">{deleteTarget?.name}</p>
                </div>
                <p className="text-orange-600 text-xs">⚠️ ไม่สามารถลบได้หากยังมีอุปกรณ์ที่ใช้ประเภทนี้อยู่</p>
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
            <SheetTitle>{editing ? 'แก้ไขประเภทอุปกรณ์' : 'เพิ่มประเภทอุปกรณ์'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อประเภท</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น โปรเจกเตอร์, แอร์, คอมพิวเตอร์"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
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
          + เพิ่มประเภทอุปกรณ์
        </button>
      </div>

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
                      <button type="button"
                        onClick={() => openEdit(t)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                      <button type="button"
                        onClick={() => setDeleteTarget(t)}
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
