'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CampusSummary, RoomSummary } from '@/types'
import { RoomStatusCard } from './RoomStatusCard'
import { StatusSummaryBar } from './StatusSummaryBar'

const LS_VIEW_KEY = 'oit_dashboard_view'

const DOT_COLOR: Record<string, string> = {
  normal: 'bg-emerald-500',
  damaged: 'bg-amber-500',
  pending_replacement: 'bg-red-500',
  unchecked: 'bg-gray-300',
}

interface Props {
  campuses: CampusSummary[]
}

export function DashboardContent({ campuses }: Props) {
  const [view, setView] = useState<'grid' | 'dot'>('grid')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_VIEW_KEY)
      if (saved === 'dot' || saved === 'grid') setView(saved as 'grid' | 'dot')
    } catch { /* ignore */ }
  }, [])

  function setViewPersist(v: 'grid' | 'dot') {
    setView(v)
    try { localStorage.setItem(LS_VIEW_KEY, v) } catch { /* ignore */ }
  }

  return (
    <>
      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-0.5 bg-gray-100 border border-gray-200 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setViewPersist('grid')}
            title="แสดงแบบการ์ด"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ⊞ การ์ด
          </button>
          <button
            type="button"
            onClick={() => setViewPersist('dot')}
            title="แสดงแบบจุด (compact)"
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === 'dot'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            ⠿ จุด
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        /* ── Grid view (existing) ───────────────────────────── */
        <div className="space-y-8">
          {campuses.map((campus) => (
            <section key={campus.id}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-1 h-5 bg-blue-600 rounded-full flex-shrink-0" />
                <h2 className="font-semibold text-gray-800 text-base leading-none">{campus.name}</h2>
                <span className="text-[11px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {campus.code}
                </span>
              </div>
              <div className="mb-4">
                <StatusSummaryBar buildings={campus.buildings} />
              </div>
              <div className="space-y-5">
                {campus.buildings.map((building) => (
                  <div key={building.id}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        {building.name}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] text-gray-300 whitespace-nowrap">
                        {building.total_rooms} ห้อง
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-1.5">
                      {building.rooms.map((room) => (
                        <RoomStatusCard key={room.id} room={room} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* ── Dot view (ultra-compact) ───────────────────────── */
        <div className="space-y-5">
          {campuses.map((campus) => (
            <section key={campus.id}>
              {/* Campus header */}
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1 h-4 bg-blue-600 rounded-full flex-shrink-0" />
                <h2 className="font-semibold text-gray-700 text-sm">{campus.name}</h2>
              </div>

              {/* Building cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {campus.buildings.map((building) => {
                  const buildingRepairs = building.rooms.reduce(
                    (sum, r) => sum + (r.pending_repairs ?? 0),
                    0
                  )
                  const hasRepairs = buildingRepairs > 0

                  return (
                    <div
                      key={building.id}
                      className={`rounded-xl border px-3 py-2.5 transition-colors ${
                        hasRepairs
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Building label row */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            hasRepairs ? 'text-orange-700' : 'text-gray-600'
                          }`}
                        >
                          {building.name}
                        </span>
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          {hasRepairs && (
                            <span className="text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                              🔧 {buildingRepairs}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400">{building.total_rooms}</span>
                        </div>
                      </div>

                      {/* Room dots */}
                      <div className="flex flex-wrap gap-1">
                        {building.rooms.map((room) => (
                          <RoomDot key={room.id} room={room} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {/* Dot legend */}
          <div className="flex items-center gap-4 flex-wrap pt-1">
            <span className="text-[10px] text-gray-400 font-medium">สัญลักษณ์:</span>
            {[
              { color: 'bg-emerald-500', label: 'ปกติ' },
              { color: 'bg-amber-500', label: 'ชำรุด' },
              { color: 'bg-red-500', label: 'รอเปลี่ยน' },
              { color: 'bg-gray-300', label: 'ยังไม่ตรวจ' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-orange-500 ring-offset-[1.5px]" />
              แจ้งซ่อมค้าง
            </span>
          </div>
        </div>
      )}
    </>
  )
}

function RoomDot({ room }: { room: RoomSummary }) {
  const dotColor = DOT_COLOR[room.status] ?? 'bg-gray-300'
  const title = `ห้อง ${room.code}${room.pending_repairs > 0 ? ` · แจ้งซ่อม ${room.pending_repairs} รายการ` : ''}`

  return (
    <Link href={`/room/${room.id}`} title={title} className="block">
      <span
        className={`block w-3 h-3 rounded-full transition-transform hover:scale-125 cursor-pointer ${dotColor} ${
          room.pending_repairs > 0 ? 'ring-2 ring-orange-500 ring-offset-[1.5px]' : ''
        }`}
      />
    </Link>
  )
}
