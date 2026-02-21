'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { CampusSummary, RoomSummary } from '@/types'
import { createClient } from '@/lib/supabase'
import { RoomStatusCard } from './RoomStatusCard'
import { StatusSummaryBar } from './StatusSummaryBar'

const LS_VIEW_KEY = 'oit_dashboard_view'
const POLL_INTERVAL = 30_000 // 30s fallback polling

const DOT_COLOR: Record<string, string> = {
  normal: 'bg-emerald-500',
  damaged: 'bg-amber-500',
  pending_replacement: 'bg-red-500',
  unchecked: 'bg-gray-300',
}

// จัดกลุ่มห้องตามชั้น → [[ชั้น, ห้อง[]], ...]  เรียงชั้นน้อย→มาก, null ไว้ท้าย
function groupByFloor(rooms: RoomSummary[]): [number | null, RoomSummary[]][] {
  const map = new Map<number | null, RoomSummary[]>()
  for (const room of rooms) {
    const key = room.floor ?? null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(room)
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (a === null) return 1
    if (b === null) return -1
    return a - b
  })
}

interface Props {
  initialCampuses: CampusSummary[]
}

export function DashboardContent({ initialCampuses }: Props) {
  const [campuses, setCampuses] = useState<CampusSummary[]>(initialCampuses)
  const [view, setView] = useState<'grid' | 'dot'>('grid')
  const [live, setLive] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' })
      if (res.ok) setCampuses(await res.json())
    } catch { /* ignore */ }
  }, [])

  function scheduleRefresh() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(refresh, 800)
  }

  useEffect(() => {
    // Restore view preference
    try {
      const saved = localStorage.getItem(LS_VIEW_KEY)
      if (saved === 'dot' || saved === 'grid') setView(saved as 'grid' | 'dot')
    } catch { /* ignore */ }

    // Polling fallback (every 30s)
    const pollTimer = setInterval(refresh, POLL_INTERVAL)

    // Supabase Realtime — instant update (requires tables added to publication)
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_requests' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_inspections' }, scheduleRefresh)
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED')
      })

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      clearInterval(pollTimer)
      supabase.removeChannel(channel)
    }
  }, [refresh]) // eslint-disable-line react-hooks/exhaustive-deps

  function setViewPersist(v: 'grid' | 'dot') {
    setView(v)
    try { localStorage.setItem(LS_VIEW_KEY, v) } catch { /* ignore */ }
  }

  return (
    <>
      {/* View toggle + live indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}
            title={live ? 'รับข้อมูลแบบ real-time' : 'polling ทุก 30 วินาที'}
          />
          <span className="text-[10px] text-gray-400">{live ? 'live' : 'auto'}</span>
        </div>

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
        /* ── Grid view ──────────────────────────────────────── */
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
                    {(() => {
                      const hasFloors = building.rooms.some((r) => r.floor != null)
                      if (!hasFloors) {
                        return (
                          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-1.5">
                            {building.rooms.map((room) => (
                              <RoomStatusCard key={room.id} room={room} />
                            ))}
                          </div>
                        )
                      }
                      return (
                        <div className="space-y-3">
                          {groupByFloor(building.rooms).map(([floor, rooms]) => (
                            <div key={floor ?? 'none'}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                  {floor != null ? `ชั้น ${floor}` : 'ไม่ระบุชั้น'}
                                </span>
                                <div className="flex-1 h-px bg-gray-100" />
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-1.5">
                                {rooms.map((room) => (
                                  <RoomStatusCard key={room.id} room={room} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
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
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1 h-4 bg-blue-600 rounded-full flex-shrink-0" />
                <h2 className="font-semibold text-gray-700 text-sm">{campus.name}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {campus.buildings.map((building) => {
                  const buildingRepairs = building.rooms.reduce(
                    (sum, r) => sum + (r.pending_repairs ?? 0), 0
                  )
                  const hasRepairs = buildingRepairs > 0

                  return (
                    <div
                      key={building.id}
                      className={`rounded-xl border px-3 py-2.5 transition-colors ${
                        hasRepairs ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold truncate ${hasRepairs ? 'text-orange-700' : 'text-gray-600'}`}>
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

                      {(() => {
                        const hasFloors = building.rooms.some((r) => r.floor != null)
                        if (!hasFloors) {
                          return (
                            <div className="flex flex-wrap gap-1">
                              {building.rooms.map((room) => <RoomDot key={room.id} room={room} />)}
                            </div>
                          )
                        }
                        return (
                          <div className="space-y-1">
                            {groupByFloor(building.rooms).map(([floor, rooms]) => (
                              <div key={floor ?? 'none'} className="flex items-center gap-1 flex-wrap">
                                <span className="text-[9px] font-bold text-gray-300 w-5 text-right shrink-0">
                                  {floor != null ? `F${floor}` : '—'}
                                </span>
                                {rooms.map((room) => <RoomDot key={room.id} room={room} />)}
                              </div>
                            ))}
                          </div>
                        )
                      })()}
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
