'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

interface ImportRow {
  room_id: string
  type_id: number
  name: string
  asset_code: string
  serial_number?: string
  installed_at?: string
  note?: string
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
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

  // Import
  const fileRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<{ valid: ImportRow[]; errors: string[] } | null>(null)
  const [importing, setImporting] = useState(false)

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

  // ── CSV Import ────────────────────────────────────────────────
  function downloadTemplate() {
    const header = 'building_code,room_code,type_name,name,asset_code,serial_number,installed_at,note'
    const ex1 = 'IT,IT301,โปรเจกเตอร์,โปรเจกเตอร์ EPSON EB-X51,NBK-PJ-0001,SN-001,2023-01-15,'
    const ex2 = 'A,A102,แอร์,แอร์ Daikin 24000 BTU,NBK-AC-0001,,,ชั้น 1'
    const csv = [header, ex1, ex2].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'equipment_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? ''
      setImportPreview(parseImportCSV(text))
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  function parseImportCSV(text: string): { valid: ImportRow[]; errors: string[] } {
    const clean = text.replace(/^\uFEFF/, '')
    const lines = clean.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return { valid: [], errors: ['ไฟล์ว่างหรือไม่มีข้อมูล'] }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase())
    const required = ['building_code', 'room_code', 'type_name', 'name', 'asset_code']
    const missing = required.filter((h) => !headers.includes(h))
    if (missing.length > 0) return { valid: [], errors: [`ไม่พบคอลัมน์: ${missing.join(', ')}`] }

    const valid: ImportRow[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })

      const lineNum = i + 1
      if (!row.name) { errors.push(`แถว ${lineNum}: ชื่ออุปกรณ์ว่างเปล่า`); continue }
      if (!row.asset_code) { errors.push(`แถว ${lineNum}: รหัสทรัพย์สินว่างเปล่า`); continue }

      const room = rooms.find(
        (r: any) =>
          r.building?.code?.toLowerCase() === row.building_code?.toLowerCase() &&
          r.code?.toLowerCase() === row.room_code?.toLowerCase()
      )
      if (!room) { errors.push(`แถว ${lineNum}: ไม่พบห้อง ${row.building_code}-${row.room_code}`); continue }

      const type = types.find((t) => t.name === row.type_name)
      if (!type) { errors.push(`แถว ${lineNum}: ไม่พบประเภท "${row.type_name}"`); continue }

      valid.push({
        room_id: room.id,
        type_id: type.id,
        name: row.name,
        asset_code: row.asset_code,
        serial_number: row.serial_number || undefined,
        installed_at: row.installed_at || undefined,
        note: row.note || undefined,
      })
    }
    return { valid, errors }
  }

  async function handleImportConfirm() {
    if (!importPreview || importPreview.valid.length === 0) return
    setImporting(true)
    try {
      const res = await fetch('/api/equipment/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: importPreview.valid }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'นำเข้าไม่สำเร็จ')
        return
      }
      const { imported } = await res.json()
      toast.success(`นำเข้าสำเร็จ ${imported} รายการ`)
      setImportPreview(null)
      const listRes = await fetch('/api/equipment')
      if (listRes.ok) setItems(await listRes.json())
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้')
    } finally {
      setImporting(false)
    }
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
      {/* Hidden CSV file input */}
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" title="เลือกไฟล์ CSV" onChange={handleFileChange} />

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
          <button type="button" onClick={downloadTemplate}
            className="text-sm px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Template CSV
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="text-sm px-3 py-2 rounded-lg border border-green-600 text-green-700 hover:bg-green-50">
            นำเข้า CSV
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

      {/* Import Preview */}
      {importPreview && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-800 mb-2">ตรวจสอบข้อมูลก่อนนำเข้า</h3>
          <p className="text-sm text-green-700 mb-1">พร้อมนำเข้า: <strong>{importPreview.valid.length}</strong> รายการ</p>
          {importPreview.errors.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-red-600 mb-1">ข้อผิดพลาด {importPreview.errors.length} รายการ:</p>
              <ul className="text-xs text-red-500 list-disc list-inside space-y-0.5 max-h-28 overflow-y-auto">
                {importPreview.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={handleImportConfirm}
              disabled={importing || importPreview.valid.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded disabled:opacity-50">
              {importing ? 'กำลังนำเข้า...' : `ยืนยันนำเข้า ${importPreview.valid.length} รายการ`}
            </button>
            <button type="button" onClick={() => setImportPreview(null)}
              className="text-sm px-4 py-1.5 rounded border hover:bg-gray-50">
              ยกเลิก
            </button>
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
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{eq.asset_code}</td>
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
