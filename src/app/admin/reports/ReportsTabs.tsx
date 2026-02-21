'use client'

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
export type ExecutiveSummary = {
  total_equipment: number
  status_normal: number
  status_damaged: number
  status_pending_replacement: number
  total_rooms: number
  rooms_not_inspected: number
  repairs_pending: number
  repairs_in_progress: number
  repairs_this_month: number
}
export type StatusRow = {
  campus_name: string; building_name: string
  total_equipment: number; status_normal: number
  status_damaged: number; status_pending_replacement: number; status_unchecked: number
}
export type PendingReplRow = {
  equipment_id: string; equipment_name: string; asset_code: string
  room_code: string; building_name: string; campus_name: string
  last_inspected_at: string; comment: string | null
}
export type NotInspectedRow = {
  room_id: string; room_code: string; building_name: string; campus_name: string
  last_inspected_at: string | null; equipment_count: number
}
export type MonthlyRow = {
  month: string; total: number; pending: number
  in_progress: number; resolved: number; closed: number
}
export type RoomRepairRow = {
  room_code: string; building_name: string; campus_name: string
  total_repairs: number; pending_repairs: number
}
export type EquipRepairRow = {
  equipment_name: string; asset_code: string; room_code: string
  total_repairs: number; pending_repairs: number
}
export type PendingRepairRow = {
  id: string; equipment_name: string; room_code: string
  building_name: string; campus_name: string
  reported_by: string; description: string; status: string
  created_at: string; days_open: number
}
export type HistoryRow = {
  inspected_date: string; room_code: string; building_name: string
  campus_name: string; equipment_count: number; damaged_count: number
}
export type WeeklyInspectionRow = {
  room_id: string; campus_name: string; building_name: string
  floor: number | null; room_code: string
  last_inspected_at: string | null; room_status: string
  damaged_count: number; pending_repl_count: number; pending_repairs: number
}

export type ReportsTabsProps = {
  summary: ExecutiveSummary
  statusRows: StatusRow[]
  pendingRepl: PendingReplRow[]
  notInspected: NotInspectedRow[]
  chartData: MonthlyRow[]
  chartMax: number
  roomRepairs: RoomRepairRow[]
  equipRepairs: EquipRepairRow[]
  pendingRepairs: PendingRepairRow[]
  history: HistoryRow[]
  weeklyInspection: WeeklyInspectionRow[]
}

// ── Helpers ────────────────────────────────────────────────────────────────
const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function monthLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-')
  return `${THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543 - 2500}`
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ── Tabs ───────────────────────────────────────────────────────────────────
type TabId = 'equipment' | 'repairs' | 'history' | 'weekly'

// ── Main component ─────────────────────────────────────────────────────────
export function ReportsTabs({
  summary: s,
  statusRows,
  pendingRepl,
  notInspected,
  chartData,
  chartMax,
  roomRepairs,
  equipRepairs,
  pendingRepairs,
  history,
  weeklyInspection,
}: ReportsTabsProps) {
  const [tab, setTab] = useState<TabId>('equipment')

  const pendingRepairCount = (s.repairs_pending ?? 0) + (s.repairs_in_progress ?? 0)

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    {
      id: 'equipment',
      label: 'สถานะอุปกรณ์',
      badge: s.status_pending_replacement > 0 ? s.status_pending_replacement : undefined,
    },
    {
      id: 'repairs',
      label: 'การแจ้งซ่อม',
      badge: pendingRepairCount > 0 ? pendingRepairCount : undefined,
    },
    { id: 'history', label: 'ประวัติการตรวจสอบ' },
    { id: 'weekly', label: 'ตรวจสอบประจำสัปดาห์' },
  ]

  return (
    <>
      {/* ── Executive Summary cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="อุปกรณ์ทั้งหมด"       value={s.total_equipment ?? 0}   color="blue" />
        <StatCard label="สถานะปกติ"             value={s.status_normal ?? 0}      color="green" />
        <StatCard label="ชำรุด"                 value={s.status_damaged ?? 0}     color="amber" />
        <StatCard label="รอเปลี่ยน"             value={s.status_pending_replacement ?? 0} color="red" />
        <StatCard label="ห้องทั้งหมด"           value={s.total_rooms ?? 0}        color="blue" />
        <StatCard label="ยังไม่ตรวจ (30 ว.)"   value={s.rooms_not_inspected ?? 0} color="orange" />
        <StatCard label="แจ้งซ่อมค้างอยู่"      value={pendingRepairCount}         color="red" />
        <StatCard label="แจ้งซ่อมเดือนนี้"     value={s.repairs_this_month ?? 0}  color="purple" />
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex-shrink-0 ${
                tab === t.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {t.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                    tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────────────────────── */}
        <div className="p-4 space-y-4">

          {/* ── Tab 1: สถานะอุปกรณ์ ─────────────────────────────── */}
          {tab === 'equipment' && (
            <>
              {/* ภาพรวมตามอาคาร */}
              <ReportCard title="ภาพรวมสถานะอุปกรณ์ตามอาคาร" exportType="status-summary">
                {statusRows.length === 0 ? <Empty /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <Th>วิทยาเขต</Th><Th>อาคาร</Th>
                          <Th align="right">ทั้งหมด</Th>
                          <Th align="right"><span className="text-emerald-600">ปกติ</span></Th>
                          <Th align="right"><span className="text-amber-600">ชำรุด</span></Th>
                          <Th align="right"><span className="text-red-600">รอเปลี่ยน</span></Th>
                          <Th align="right"><span className="text-gray-400">ยังไม่ตรวจ</span></Th>
                        </tr>
                      </thead>
                      <tbody>
                        {statusRows.map((r, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <Td>{r.campus_name}</Td>
                            <Td>{r.building_name}</Td>
                            <Td align="right" bold>{r.total_equipment}</Td>
                            <Td align="right"><span className="text-emerald-600">{r.status_normal}</span></Td>
                            <Td align="right"><span className="text-amber-600">{r.status_damaged}</span></Td>
                            <Td align="right"><span className="text-red-600">{r.status_pending_replacement}</span></Td>
                            <Td align="right"><span className="text-gray-400">{r.status_unchecked}</span></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportCard>

              {/* อุปกรณ์รอเปลี่ยน */}
              <ReportCard title={`อุปกรณ์รอเปลี่ยน (${pendingRepl.length} รายการ)`} exportType="pending-replacement">
                {pendingRepl.length === 0
                  ? <Empty text="ไม่มีอุปกรณ์ที่อยู่ในสถานะรอเปลี่ยน" />
                  : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <Th>รหัสอุปกรณ์</Th><Th>ชื่ออุปกรณ์</Th>
                          <Th>ห้อง</Th><Th>อาคาร</Th><Th>วิทยาเขต</Th>
                          <Th>ตรวจสอบล่าสุด</Th><Th>หมายเหตุ</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRepl.map((r) => (
                          <tr key={r.equipment_id} className="border-b border-gray-50 hover:bg-gray-50">
                            <Td><span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{r.asset_code}</span></Td>
                            <Td bold>{r.equipment_name}</Td>
                            <Td>{r.room_code}</Td>
                            <Td>{r.building_name}</Td>
                            <Td>{r.campus_name}</Td>
                            <Td>{fmtDate(r.last_inspected_at)}</Td>
                            <Td><span className="text-gray-400">{r.comment ?? '—'}</span></Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportCard>

              {/* ห้องที่ยังไม่ตรวจสอบ */}
              <ReportCard title={`ห้องที่ยังไม่ตรวจสอบภายใน 30 วัน (${notInspected.length} ห้อง)`} exportType="not-inspected">
                {notInspected.length === 0
                  ? <Empty text="ทุกห้องถูกตรวจสอบภายใน 30 วันที่ผ่านมา" />
                  : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <Th>ห้อง</Th><Th>อาคาร</Th><Th>วิทยาเขต</Th>
                          <Th align="right">จำนวนอุปกรณ์</Th>
                          <Th>ตรวจสอบล่าสุด</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {notInspected.map((r) => (
                          <tr key={r.room_id} className="border-b border-gray-50 hover:bg-gray-50">
                            <Td bold>{r.room_code}</Td>
                            <Td>{r.building_name}</Td>
                            <Td>{r.campus_name}</Td>
                            <Td align="right">{r.equipment_count}</Td>
                            <Td>
                              {r.last_inspected_at
                                ? <span className="text-amber-600">{fmtDate(r.last_inspected_at)}</span>
                                : <span className="text-red-500">ยังไม่เคยตรวจ</span>}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportCard>
            </>
          )}

          {/* ── Tab 2: การแจ้งซ่อม ───────────────────────────────── */}
          {tab === 'repairs' && (
            <>
              {/* รายเดือน */}
              <ReportCard title="การแจ้งซ่อมรายเดือน (12 เดือนย้อนหลัง)" exportType="repair-monthly">
                <div className="flex items-end gap-1 h-28 px-1">
                  {chartData.map((r) => {
                    const h = chartMax > 0 ? Math.round((r.total / chartMax) * 100) : 0
                    return (
                      <div key={r.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                          <div className="bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                            {r.total} รายการ
                          </div>
                          <div className="w-1.5 h-1.5 bg-gray-800 rotate-45 -mt-0.5" />
                        </div>
                        <div
                          className={`w-full rounded-t transition-all ${r.total > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}
                          style={{ height: `${Math.max(h, r.total > 0 ? 4 : 2)}%` }}
                        />
                        <span className="text-[9px] text-gray-400 leading-none">{monthLabel(r.month)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500 border-t border-gray-50 pt-3">
                  {(() => {
                    const tot = chartData.reduce(
                      (a, r) => ({
                        total: a.total + r.total,
                        pending: a.pending + r.pending,
                        in_progress: a.in_progress + r.in_progress,
                        resolved: a.resolved + r.resolved,
                        closed: a.closed + r.closed,
                      }),
                      { total: 0, pending: 0, in_progress: 0, resolved: 0, closed: 0 }
                    )
                    return (
                      <>
                        <span>รวม <b>{tot.total}</b></span>
                        <span className="text-orange-500">รอดำเนินการ {tot.pending}</span>
                        <span className="text-blue-500">กำลังดำเนินการ {tot.in_progress}</span>
                        <span className="text-emerald-500">แก้ไขแล้ว {tot.resolved}</span>
                        <span className="text-gray-400">ปิด {tot.closed}</span>
                      </>
                    )
                  })()}
                </div>
              </ReportCard>

              {/* ห้องที่แจ้งซ่อมบ่อย */}
              <ReportCard title="ห้องที่มีการแจ้งซ่อมมากที่สุด (Top 10)" exportType="rooms-most-repairs">
                {roomRepairs.length === 0 ? <Empty /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <Th>#</Th><Th>ห้อง</Th><Th>อาคาร</Th><Th>วิทยาเขต</Th>
                          <Th align="right">แจ้งซ่อมทั้งหมด</Th>
                          <Th align="right">ค้างอยู่</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomRepairs.map((r, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <Td><span className="text-gray-300">{i + 1}</span></Td>
                            <Td bold>{r.room_code}</Td>
                            <Td>{r.building_name}</Td>
                            <Td>{r.campus_name}</Td>
                            <Td align="right" bold>{r.total_repairs}</Td>
                            <Td align="right">
                              {r.pending_repairs > 0
                                ? <span className="text-orange-500">{r.pending_repairs}</span>
                                : <span className="text-gray-300">0</span>}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportCard>

              {/* อุปกรณ์ที่แจ้งซ่อมบ่อย */}
              <ReportCard title="อุปกรณ์ที่มีการแจ้งซ่อมมากที่สุด (Top 10)" exportType="equipment-most-repairs">
                {equipRepairs.length === 0 ? <Empty /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <Th>#</Th><Th>รหัสอุปกรณ์</Th><Th>ชื่ออุปกรณ์</Th><Th>ห้อง</Th>
                          <Th align="right">แจ้งซ่อมทั้งหมด</Th>
                          <Th align="right">ค้างอยู่</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipRepairs.map((r, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <Td><span className="text-gray-300">{i + 1}</span></Td>
                            <Td><span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{r.asset_code}</span></Td>
                            <Td bold>{r.equipment_name}</Td>
                            <Td>{r.room_code}</Td>
                            <Td align="right" bold>{r.total_repairs}</Td>
                            <Td align="right">
                              {r.pending_repairs > 0
                                ? <span className="text-orange-500">{r.pending_repairs}</span>
                                : <span className="text-gray-300">0</span>}
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportCard>

              {/* คำร้องค้างอยู่ */}
              <ReportCard title={`คำร้องซ่อมที่ยังค้างอยู่ (${pendingRepairs.length} รายการ)`} exportType="repair-pending">
                {pendingRepairs.length === 0
                  ? <Empty text="ไม่มีคำร้องซ่อมค้างอยู่" />
                  : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <Th>อุปกรณ์</Th><Th>ห้อง</Th><Th>อาคาร</Th>
                          <Th>ผู้แจ้ง</Th><Th>รายละเอียด</Th>
                          <Th align="right">สถานะ</Th>
                          <Th align="right">วันที่แจ้ง</Th>
                          <Th align="right">ค้างมา</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRepairs.map((r) => (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <Td bold>{r.equipment_name}</Td>
                            <Td>{r.room_code}</Td>
                            <Td>{r.building_name}</Td>
                            <Td>{r.reported_by}</Td>
                            <Td><span className="text-gray-500 line-clamp-1 max-w-[160px] block">{r.description}</span></Td>
                            <Td align="right"><StatusBadge status={r.status} /></Td>
                            <Td align="right">{fmtDate(r.created_at)}</Td>
                            <Td align="right">
                              <span className={`font-medium ${r.days_open >= 7 ? 'text-red-500' : r.days_open >= 3 ? 'text-amber-500' : 'text-gray-500'}`}>
                                {r.days_open} ว.
                              </span>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ReportCard>
            </>
          )}

          {/* ── Tab 3: ประวัติการตรวจสอบ ─────────────────────────── */}
          {tab === 'history' && (
            <ReportCard title="การตรวจสอบล่าสุด 30 รายการ" exportType="inspection-history">
              {history.length === 0 ? <Empty /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500">
                        <Th>วันที่</Th><Th>ห้อง</Th><Th>อาคาร</Th><Th>วิทยาเขต</Th>
                        <Th align="right">อุปกรณ์ที่ตรวจ</Th>
                        <Th align="right">พบปัญหา</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <Td>{fmtDate(r.inspected_date)}</Td>
                          <Td bold>{r.room_code}</Td>
                          <Td>{r.building_name}</Td>
                          <Td>{r.campus_name}</Td>
                          <Td align="right">{r.equipment_count}</Td>
                          <Td align="right">
                            {r.damaged_count > 0
                              ? <span className="text-amber-600 font-medium">{r.damaged_count}</span>
                              : <span className="text-emerald-500">0</span>}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>
          )}

          {/* ── Tab 4: ตรวจสอบประจำสัปดาห์ ──────────────────────── */}
          {tab === 'weekly' && (
            <ReportCard
              title={`วันที่ตรวจสอบล่าสุดรายห้อง (${weeklyInspection.length} ห้อง)`}
              exportType="weekly-inspection"
            >
              {weeklyInspection.length === 0 ? <Empty /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500">
                        <Th>วิทยาเขต</Th>
                        <Th>อาคาร</Th>
                        <Th align="right">ชั้น</Th>
                        <Th>ห้อง</Th>
                        <Th>ตรวจสอบล่าสุด</Th>
                        <Th>สถานะ</Th>
                        <Th align="right">แจ้งซ่อมค้าง</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyInspection.map((r) => (
                        <tr key={r.room_id} className="border-b border-gray-50 hover:bg-gray-50">
                          <Td>{r.campus_name}</Td>
                          <Td>{r.building_name}</Td>
                          <Td align="right">
                            {r.floor != null
                              ? <span className="text-gray-500">{r.floor}</span>
                              : <span className="text-gray-300">—</span>}
                          </Td>
                          <Td bold>{r.room_code}</Td>
                          <Td>
                            {r.last_inspected_at
                              ? <span>{fmtDate(r.last_inspected_at)}</span>
                              : <span className="text-gray-300">ยังไม่เคยตรวจ</span>}
                          </Td>
                          <Td>
                            <WeeklyStatusBadge row={r} />
                          </Td>
                          <Td align="right">
                            {r.pending_repairs > 0
                              ? <span className="text-orange-500 font-medium">🔧 {r.pending_repairs}</span>
                              : <span className="text-gray-300">—</span>}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>
          )}

        </div>
      </div>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:   'text-blue-700',
    green:  'text-emerald-700',
    amber:  'text-amber-700',
    red:    'text-red-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <p className="text-[11px] text-gray-400 mb-1 leading-tight">{label}</p>
      <p className={`text-2xl font-bold ${colors[color] ?? 'text-gray-700'}`}>{value.toLocaleString()}</p>
    </div>
  )
}

function ReportCard({ title, exportType, children }: { title: string; exportType?: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-white">
        <h3 className="text-xs font-semibold text-gray-700">{title}</h3>
        {exportType && (
          <a
            href={`/api/reports/export/${exportType}`}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
            title="Download CSV"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M8 12l-4-4h2.5V4h3v4H12L8 12z"/>
              <path d="M2 13h12v1.5H2z"/>
            </svg>
            CSV
          </a>
        )}
      </div>
      <div className="p-4 bg-white">{children}</div>
    </div>
  )
}

function Empty({ text = 'ไม่มีข้อมูล' }: { text?: string }) {
  return <p className="text-xs text-gray-400 text-center py-4">{text}</p>
}

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`pb-2 font-medium text-[11px] ${align === 'right' ? 'text-right' : 'text-left'} pr-3 last:pr-0`}>
      {children}
    </th>
  )
}

function Td({ children, align = 'left', bold = false }: { children?: React.ReactNode; align?: 'left' | 'right'; bold?: boolean }) {
  return (
    <td className={`py-2 pr-3 last:pr-0 ${align === 'right' ? 'text-right' : ''} ${bold ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
      {children}
    </td>
  )
}

function WeeklyStatusBadge({ row }: { row: WeeklyInspectionRow }) {
  if (row.room_status === 'unchecked')
    return <span className="text-gray-400">ยังไม่ตรวจ</span>
  if (row.room_status === 'pending_replacement')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
        รอเปลี่ยน · {row.pending_repl_count} รายการ
      </span>
    )
  if (row.room_status === 'damaged')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
        ชำรุด · {row.damaged_count} รายการ
      </span>
    )
  return <span className="text-[10px] text-emerald-600">ปกติ</span>
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') return <span className="inline-flex items-center gap-1 text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full">รอดำเนินการ</span>
  if (status === 'in_progress') return <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">กำลังดำเนินการ</span>
  return <span className="text-[10px] text-gray-400">{status}</span>
}
