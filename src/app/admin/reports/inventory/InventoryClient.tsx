'use client'

import { useState, useMemo } from 'react'

export type InventoryRow = {
  equipment_id: string
  campus_name: string
  building_name: string
  floor: number | null
  room_code: string
  type_name: string
  equipment_name: string
  asset_code: string
  serial_number: string
  installed_at: string | null
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

function escCsv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadCsv(rows: InventoryRow[]) {
  const headers = ['วิทยาเขต', 'อาคาร', 'ชั้น', 'ห้อง', 'ประเภท', 'ชื่ออุปกรณ์', 'รหัสทรัพย์สิน', 'Serial', 'วันติดตั้ง']
  const lines = [
    headers.map(escCsv).join(','),
    ...rows.map((r) =>
      [
        r.campus_name,
        r.building_name,
        r.floor ?? '',
        r.room_code,
        r.type_name,
        r.equipment_name,
        r.asset_code,
        r.serial_number,
        r.installed_at ?? '',
      ]
        .map(escCsv)
        .join(',')
    ),
  ]
  const csv = '\uFEFF' + lines.join('\r\n') // BOM → Excel ภาษาไทยถูกต้อง
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ทะเบียนอุปกรณ์-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function InventoryClient({ rows: allRows }: { rows: InventoryRow[] }) {
  const [search, setSearch] = useState('')

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return allRows
    return allRows.filter((r) =>
      [r.campus_name, r.building_name, r.room_code, r.type_name, r.equipment_name, r.asset_code, r.serial_number]
        .some((f) => f.toLowerCase().includes(q))
    )
  }, [allRows, search])

  return (
    <div>
      {/* ── Search + Export bar ─────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="search"
          placeholder="ค้นหา ห้อง / ชื่ออุปกรณ์ / รหัสทรัพย์สิน / serial..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-0 max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {rows.length.toLocaleString()} / {allRows.length.toLocaleString()} รายการ
        </span>
        <button
          type="button"
          onClick={() => downloadCsv(rows)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M8 12l-4-4h2.5V4h3v4H12L8 12z" />
            <path d="M2 13h12v1.5H2z" />
          </svg>
          ดาวน์โหลด CSV
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
            <tr className="text-gray-500">
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">#</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">วิทยาเขต</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">อาคาร</th>
              <th className="px-3 py-2.5 text-center font-medium whitespace-nowrap">ชั้น</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">ห้อง</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">ประเภท</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">ชื่ออุปกรณ์</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">รหัสทรัพย์สิน</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">Serial</th>
              <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">วันติดตั้ง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-gray-400">
                  {search ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' : 'ไม่มีข้อมูลอุปกรณ์'}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.equipment_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-gray-300 tabular-nums">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.campus_name}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.building_name}</td>
                  <td className="px-3 py-2 text-center text-gray-500">
                    {r.floor != null ? r.floor : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{r.room_code}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                    {r.type_name || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-800 font-medium">{r.equipment_name}</td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {r.asset_code}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-gray-500">
                    {r.serial_number || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{fmtDate(r.installed_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
