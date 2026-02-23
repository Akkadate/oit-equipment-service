'use client'

import { useEffect, useMemo, useState } from 'react'
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

const ALL = '__all__'
const PAGE_SIZE = 25

const STATUS_LABEL: Record<string, string> = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังซ่อม',
  resolved: 'ซ่อมแล้ว',
  closed: 'ปิด',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

export function EquipmentManager({ types, rooms, equipment: initial }: Props) {
  const [items, setItems] = useState<any[]>(initial)

  // Retired equipment
  const [showRetired, setShowRetired] = useState(false)
  const [retiredItems, setRetiredItems] = useState<any[] | null>(null)
  const [loadingRetired, setLoadingRetired] = useState(false)

  async function toggleRetired() {
    if (!showRetired && retiredItems === null) {
      setLoadingRetired(true)
      try {
        const res = await fetch('/api/equipment?showRetired=true')
        if (res.ok) {
          const all: any[] = await res.json()
          setRetiredItems(all.filter((e) => e.retired_at))
        }
      } finally {
        setLoadingRetired(false)
      }
    }
    setShowRetired((v) => !v)
  }

  // Add/Edit modal
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // Search / filter
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState(ALL)
  const [filterRoom, setFilterRoom] = useState(ALL)

  // Pagination
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [search, filterType, filterRoom])

  // Repair history modal
  const [repairEq, setRepairEq] = useState<any | null>(null)
  const [repairs, setRepairs] = useState<any[]>([])
  const [loadingRepairs, setLoadingRepairs] = useState(false)

  async function openRepairs(eq: any) {
    setRepairEq(eq)
    setRepairs([])
    setLoadingRepairs(true)
    try {
      const res = await fetch(`/api/repairs?equipmentId=${eq.id}`)
      if (res.ok) setRepairs(await res.json())
    } finally {
      setLoadingRepairs(false)
    }
  }

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
    if (!res.ok) { toast.error('จำหน่ายออกไม่สำเร็จ'); return }
    setItems((prev) => prev.filter((x) => x.id !== eq.id))
    toast.success(`จำหน่ายออก "${eq.name}" แล้ว`)
  }


  // ── Filtered + paginated ──────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((eq) => {
      if (filterType !== ALL && String(eq.equipment_type?.id) !== filterType) return false
      if (filterRoom !== ALL && eq.room?.id !== filterRoom) return false
      if (q) {
        const hay = [eq.name, eq.asset_code, eq.serial_number, eq.room?.code, eq.room?.building?.name]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, search, filterType, filterRoom])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const hasFilter = search || filterType !== ALL || filterRoom !== ALL

  // Page number list with ellipsis
  const pageNums: (number | '...')[] = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          type="search"
          placeholder="ค้นหาชื่อ / รหัสทรัพย์สิน / Serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          title="กรองตามประเภทอุปกรณ์"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={ALL}>ทุกประเภท</option>
          {types.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
        </select>
        <select
          title="กรองตามห้อง"
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={ALL}>ทุกห้อง</option>
          {rooms.map((r: any) => <option key={r.id} value={r.id}>{r.building?.code} · {r.code}</option>)}
        </select>
        {hasFilter && (
          <button type="button"
            onClick={() => { setSearch(''); setFilterType(ALL); setFilterRoom(ALL) }}
            className="text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 rounded border hover:border-red-200">
            ล้างตัวกรอง
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={toggleRetired}
            disabled={loadingRetired}
            className={`text-sm px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
              showRetired
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}>
            {loadingRetired ? 'กำลังโหลด...' : showRetired ? 'ซ่อนจำหน่ายออก' : 'จำหน่ายออกแล้ว'}
          </button>
          <Button onClick={openAdd}>+ เพิ่มอุปกรณ์</Button>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500">
          {hasFilter ? `แสดง ${filtered.length} จาก ${items.length} รายการ` : `รวม ${items.length} รายการ`}
        </p>
        {totalPages > 1 && <p className="text-xs text-gray-400">หน้า {safePage} / {totalPages}</p>}
      </div>


      {/* Repair History Modal */}
      {repairEq && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRepairEq(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">ประวัติการแจ้งซ่อม</p>
                <p className="font-semibold text-gray-900">{repairEq.name}</p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{repairEq.asset_code}</p>
              </div>
              <button type="button" onClick={() => setRepairEq(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5">×</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {loadingRepairs ? (
                <p className="text-sm text-gray-400 text-center py-6">กำลังโหลด...</p>
              ) : repairs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">ไม่มีประวัติการแจ้งซ่อม</p>
              ) : (
                <div className="space-y-3">
                  {repairs.map((r: any) => (
                    <div key={r.id} className="border rounded-xl p-3.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{r.description}</p>
                      <p className="text-xs text-gray-500 mt-1">ผู้แจ้ง: {r.reported_by}{r.reporter_phone ? ` · ${r.reporter_phone}` : ''}</p>
                      {r.resolved_note && (
                        <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1 mt-2">หมายเหตุ: {r.resolved_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
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
                    <SelectTrigger><SelectValue placeholder="เลือกห้อง" /></SelectTrigger>
                    <SelectContent>
                      {rooms.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.building?.code} · {r.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>ประเภท <span className="text-red-500">*</span></Label>
                  <Select value={form.type_id} onValueChange={(v) => set('type_id', v)}>
                    <SelectTrigger><SelectValue placeholder="ประเภทอุปกรณ์" /></SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>ชื่ออุปกรณ์ <span className="text-red-500">*</span></Label>
                <Input placeholder="เช่น โปรเจกเตอร์ EPSON EB-X51" value={form.name}
                  onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>รหัสทรัพย์สิน <span className="text-red-500">*</span></Label>
                  <Input placeholder="NBK-PJ-0001" value={form.asset_code}
                    onChange={(e) => set('asset_code', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Serial Number</Label>
                  <Input placeholder="SN-XXXXX" value={form.serial_number}
                    onChange={(e) => set('serial_number', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>วันที่ติดตั้ง</Label>
                <Input type="date" value={form.installed_at}
                  onChange={(e) => set('installed_at', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>หมายเหตุ</Label>
                <Textarea placeholder="ข้อมูลเพิ่มเติม..." value={form.note}
                  onChange={(e) => set('note', e.target.value)} className="h-16 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ชื่ออุปกรณ์</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">รหัสทรัพย์สิน</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ประเภท</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ห้อง</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Serial</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">ติดตั้ง</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {hasFilter ? 'ไม่พบรายการที่ตรงกับเงื่อนไข' : 'ยังไม่มีอุปกรณ์'}
                </td>
              </tr>
            ) : (
              paginated.map((eq: any) => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{eq.name}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openRepairs(eq)}
                      className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline underline-offset-2">
                      {eq.asset_code}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{eq.equipment_type?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{eq.room?.building?.name} · {eq.room?.code}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{eq.serial_number ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {eq.installed_at ? new Date(eq.installed_at).toLocaleDateString('th-TH') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => openEdit(eq)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50">
                        แก้ไข
                      </button>
                      <button type="button" onClick={() => handleRetire(eq)}
                        className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1 border border-orange-200 rounded hover:bg-orange-50">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <button type="button" onClick={() => setPage(1)} disabled={safePage === 1}
            className="text-xs px-2 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-40">«</button>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
            className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-40">ก่อนหน้า</button>

          {pageNums.map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="text-xs text-gray-400 px-1">…</span>
            ) : (
              <button key={p} type="button" onClick={() => setPage(p as number)}
                className={`text-xs px-3 py-1.5 rounded border ${safePage === p ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                {p}
              </button>
            )
          )}

          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
            className="text-xs px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-40">ถัดไป</button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
            className="text-xs px-2 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-40">»</button>
        </div>
      )}

      {/* Retired equipment section */}
      {showRetired && retiredItems !== null && (
        <div className="mt-8">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            อุปกรณ์ที่จำหน่ายออกแล้ว ({retiredItems.length} รายการ)
          </h3>
          {retiredItems.length === 0 ? (
            <p className="text-gray-400 text-sm">ไม่มีอุปกรณ์ที่จำหน่ายออก</p>
          ) : (
            <div className="bg-orange-50 rounded-xl border border-orange-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-orange-100 border-b border-orange-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">ชื่ออุปกรณ์</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">รหัสทรัพย์สิน</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">ประเภท</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">ห้อง</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">วันที่จำหน่ายออก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {retiredItems.map((eq: any) => (
                    <tr key={eq.id} className="opacity-70">
                      <td className="px-4 py-3 font-medium text-gray-600 line-through">{eq.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{eq.asset_code}</td>
                      <td className="px-4 py-3 text-gray-400">{eq.equipment_type?.name}</td>
                      <td className="px-4 py-3 text-gray-400">{eq.room?.building?.name} · {eq.room?.code}</td>
                      <td className="px-4 py-3 text-orange-600 text-xs">
                        {eq.retired_at ? new Date(eq.retired_at).toLocaleDateString('th-TH') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
