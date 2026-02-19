'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { repairStatusLabel, repairStatusColor } from '@/lib/equipment'

const INSP_PAGE = 20
const ACTIVE_STATUSES = new Set(['pending', 'in_progress'])

interface Props {
  equipment: any[]
  repairs: any[]
  inspections: any[]
}

export function RoomDetail({ equipment, repairs, inspections }: Props) {
  const [repairTab, setRepairTab] = useState<'active' | 'closed'>('active')
  const [inspPage, setInspPage] = useState(1)

  const activeRepairs = repairs.filter((r) => ACTIVE_STATUSES.has(r.status))
  const closedRepairs = repairs.filter((r) => !ACTIVE_STATUSES.has(r.status))
  const shownRepairs = repairTab === 'active' ? activeRepairs : closedRepairs

  const totalInspPages = Math.max(1, Math.ceil(inspections.length / INSP_PAGE))
  const pagedInspections = inspections.slice((inspPage - 1) * INSP_PAGE, inspPage * INSP_PAGE)

  return (
    <>
      {/* ── Equipment list ─────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          อุปกรณ์ทั้งหมด ({equipment.length} รายการ)
        </h2>
        {equipment.length === 0 ? (
          <p className="text-gray-400 text-sm">ยังไม่มีอุปกรณ์</p>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">ชื่ออุปกรณ์</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">รหัส</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">ประเภท</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">สถานะล่าสุด</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600">ตรวจล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {equipment.map((eq: any) => (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{eq.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{eq.asset_code}</td>
                    <td className="px-4 py-3 text-gray-500">{eq.equipment_type?.name}</td>
                    <td className="px-4 py-3">
                      {eq.latest_status ? (
                        <StatusBadge status={eq.latest_status} />
                      ) : (
                        <span className="text-gray-400 text-xs">ยังไม่ตรวจ</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {eq.latest_inspected_at
                        ? new Date(eq.latest_inspected_at).toLocaleDateString('th-TH')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Repair requests ────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-base font-semibold text-gray-800">รายการแจ้งซ่อม</h2>
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setRepairTab('active')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                repairTab === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              ค้างอยู่ ({activeRepairs.length})
            </button>
            <button
              type="button"
              onClick={() => setRepairTab('closed')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                repairTab === 'closed'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              ปิดงานแล้ว ({closedRepairs.length})
            </button>
          </div>
        </div>

        {shownRepairs.length === 0 ? (
          <p className="text-gray-400 text-sm">
            {repairTab === 'active' ? 'ไม่มีรายการค้างอยู่' : 'ไม่มีรายการที่ปิดแล้ว'}
          </p>
        ) : (
          <div className="space-y-2">
            {shownRepairs.map((r: any) => (
              <div key={r.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{r.equipment?.name}</p>
                    <p className="text-gray-600 text-sm mt-1">{r.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      โดย {r.reported_by}
                      {r.reporter_phone && ` · ${r.reporter_phone}`}
                      {' · '}
                      {new Date(r.created_at).toLocaleDateString('th-TH')}
                    </p>
                    {r.resolved_note && (
                      <p className="text-green-600 text-xs mt-1">✓ {r.resolved_note}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${repairStatusColor[r.status]}`}
                  >
                    {repairStatusLabel[r.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Inspection history ─────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-3">
          ประวัติการตรวจสอบ ({inspections.length} รายการ)
        </h2>
        {inspections.length === 0 ? (
          <p className="text-gray-400 text-sm">ยังไม่มีประวัติ</p>
        ) : (
          <>
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">อุปกรณ์</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">สถานะ</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">หมายเหตุ / รูป</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">ผู้ตรวจ</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">วันที่ตรวจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagedInspections.map((ins: any) => (
                    <tr key={ins.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{ins.equipment?.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ins.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {ins.comment && <p>{ins.comment}</p>}
                        {ins.photo_url && (
                          <a href={ins.photo_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={ins.photo_url}
                              alt="รูปอุปกรณ์"
                              className="mt-1 h-16 w-16 object-cover rounded border hover:opacity-80 transition-opacity"
                            />
                          </a>
                        )}
                        {!ins.comment && !ins.photo_url && <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {ins.inspector_name ?? <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(ins.inspected_at).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalInspPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-3">
                <button
                  type="button"
                  disabled={inspPage === 1}
                  onClick={() => setInspPage((p) => p - 1)}
                  className="px-3 py-1 text-sm rounded border bg-white disabled:opacity-40 hover:bg-gray-50"
                >
                  ก่อนหน้า
                </button>
                {Array.from({ length: totalInspPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setInspPage(p)}
                    className={`w-8 h-8 text-sm rounded border ${
                      p === inspPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={inspPage === totalInspPages}
                  onClick={() => setInspPage((p) => p + 1)}
                  className="px-3 py-1 text-sm rounded border bg-white disabled:opacity-40 hover:bg-gray-50"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
