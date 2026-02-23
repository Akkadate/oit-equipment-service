'use client'

import { useState, useRef } from 'react'

type ParsedRow = {
  building_code: string
  room_code: string
  type_name: string
  name: string
  asset_code: string
  serial_number: string
  installed_at: string | null
  note: string
  _dateRaw: string
  _dateError: boolean
}

// รองรับ dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
function parseDate(s: string): { iso: string | null; error: boolean } {
  if (!s?.trim()) return { iso: null, error: false }
  const t = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return { iso: t, error: false }
  const m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return { iso: `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, error: false }
  return { iso: null, error: true }
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''))
  return lines.slice(1)
    .map(line => {
      const vals = line.split(',')
      const r = Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()])) as any
      const { iso, error } = parseDate(r.installed_at ?? '')
      return {
        building_code: r.building_code ?? '',
        room_code: r.room_code ?? '',
        type_name: r.type_name ?? '',
        name: r.name ?? '',
        asset_code: r.asset_code ?? '',
        serial_number: r.serial_number ?? '',
        installed_at: iso,
        note: r.note ?? '',
        _dateRaw: r.installed_at ?? '',
        _dateError: error,
      }
    })
    .filter(r => r.building_code && r.room_code && r.name && r.asset_code)
}

type Result = { ok: number; skipped: number; errors: string[] }

export function ImportClient() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  function handleFile(file: File) {
    setResult(null)
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setRows(parseCsv(text))
    }
    reader.readAsText(file, 'utf-8')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const dateErrors = rows.filter(r => r._dateError).length
  const canImport = rows.length > 0 && dateErrors === 0

  async function handleImport() {
    setLoading(true)
    try {
      const res = await fetch('/api/equipment/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      setResult(data)
      if (data.ok > 0) setRows([])
    } catch {
      setResult({ ok: 0, skipped: rows.length, errors: ['เกิดข้อผิดพลาดในการเชื่อมต่อ'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload area */}
      {rows.length === 0 && !result && (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10 mx-auto text-gray-300 mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-600">คลิกหรือลากไฟล์ CSV มาวาง</p>
          <p className="text-xs text-gray-400 mt-1">รองรับ: building_code, room_code, type_name, name, asset_code, serial_number, installed_at, note</p>
          <p className="text-xs text-gray-400">วันที่รองรับ: dd/mm/yyyy · dd-mm-yyyy · yyyy-mm-dd</p>
          <input ref={inputRef} type="file" accept=".csv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-4 border ${result.ok > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="font-semibold text-sm text-gray-800 mb-1">
            ✅ นำเข้าสำเร็จ {result.ok} รายการ
            {result.skipped > 0 && ` · ⚠️ ข้าม ${result.skipped} รายการ`}
          </p>
          {result.errors.slice(0, 10).map((e, i) => (
            <p key={i} className="text-xs text-red-600">- {e}</p>
          ))}
          {result.errors.length > 10 && <p className="text-xs text-red-500">...และอีก {result.errors.length - 10} รายการ</p>}
          <button onClick={() => { setResult(null); setRows([]) }}
            className="mt-3 text-xs text-blue-600 hover:underline">
            import ไฟล์อื่น
          </button>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{fileName}</p>
              <p className="text-xs text-gray-500">{rows.length} แถว
                {dateErrors > 0 && <span className="text-red-500 ml-2">⚠️ วันที่ผิด format {dateErrors} แถว</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRows([]); setFileName('') }}
                className="text-sm text-gray-500 hover:text-red-600 border border-gray-200 px-3 py-2 rounded-lg transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleImport} disabled={!canImport || loading}
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 px-4 py-2 rounded-lg transition-colors">
                {loading ? 'กำลัง import...' : `Import ${rows.length} รายการ`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-500">
                  <th className="px-3 py-2.5 text-left font-medium">#</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">อาคาร</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">ห้อง</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">ประเภท</th>
                  <th className="px-3 py-2.5 text-left font-medium">ชื่ออุปกรณ์</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">รหัสทรัพย์สิน</th>
                  <th className="px-3 py-2.5 text-left font-medium">Serial</th>
                  <th className="px-3 py-2.5 text-left font-medium whitespace-nowrap">วันติดตั้ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-300 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.building_code}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{r.room_code}</td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.type_name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 text-gray-800">{r.name}</td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r.asset_code}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-gray-500">{r.serial_number || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r._dateError
                        ? <span className="text-red-500 font-medium">⚠️ {r._dateRaw}</span>
                        : <span className="text-gray-500">{r.installed_at ?? <span className="text-gray-300">—</span>}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
