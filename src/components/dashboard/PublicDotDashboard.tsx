'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CampusSummary, RoomSummary } from '@/types'
import { createClient } from '@/lib/supabase'

const POLL_INTERVAL = 30_000

const STATUS_COLOR: Record<string, string> = {
  normal: 'bg-emerald-500',
  damaged: 'bg-amber-500',
  pending_replacement: 'bg-red-500',
  unchecked: 'bg-slate-600',
}

const STATUS_LABEL: Record<string, string> = {
  normal: 'ปกติ',
  damaged: 'ชำรุด',
  pending_replacement: 'รอเปลี่ยน',
  unchecked: 'ยังไม่ตรวจ',
}

const STATUS_GLOW: Record<string, string> = {
  normal: 'shadow-emerald-500/60',
  damaged: 'shadow-amber-500/60',
  pending_replacement: 'shadow-red-500/60',
  unchecked: '',
}

const STATUS_TEXT_COLOR: Record<string, string> = {
  normal: 'text-emerald-400',
  damaged: 'text-amber-400',
  pending_replacement: 'text-red-400',
  unchecked: 'text-slate-400',
}

const STATUS_DOT_CLASS: Record<string, string> = {
  normal: 'bg-emerald-500',
  damaged: 'bg-amber-500',
  pending_replacement: 'bg-red-500',
  unchecked: 'bg-slate-500',
}

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

export function PublicDotDashboard({ initialCampuses }: Props) {
  const [campuses, setCampuses] = useState<CampusSummary[]>(initialCampuses)
  const [live, setLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard', { cache: 'no-store' })
      if (res.ok) {
        setCampuses(await res.json())
        setLastUpdated(new Date())
      }
    } catch { /* ignore */ }
  }, [])

  function scheduleRefresh() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(refresh, 800)
  }

  useEffect(() => {
    const pollTimer = setInterval(refresh, POLL_INTERVAL)

    const supabase = createClient()
    const channel = supabase
      .channel('public-status-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_requests' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipment_inspections' }, scheduleRefresh)
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      clearInterval(pollTimer)
      supabase.removeChannel(channel)
    }
  }, [refresh]) // eslint-disable-line react-hooks/exhaustive-deps

  const timeStr = lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="space-y-8">
      {/* Live status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2.5 w-2.5`}>
            {live && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${live ? 'bg-emerald-500' : 'bg-slate-600'}`} />
          </span>
          <span className={`text-xs font-medium ${live ? 'text-emerald-400' : 'text-slate-500'}`}>
            {live ? 'Live · อัปเดตอัตโนมัติ' : 'ไม่มีสัญญาณ live'}
          </span>
        </div>
        <span className="text-[11px] text-slate-600 tabular-nums">อัปเดตล่าสุด {timeStr}</span>
      </div>

      {/* Campus sections */}
      {campuses.map((campus) => (
        <section key={campus.id} className="space-y-3">
          {/* Campus label */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
              {campus.name}
            </span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          {/* Building grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {campus.buildings.map((building) => {
              const buildingRepairs = building.rooms.reduce(
                (sum, r) => sum + (r.pending_repairs ?? 0), 0
              )
              const hasRepairs = buildingRepairs > 0
              const hasFloors = building.rooms.some((r) => r.floor != null)

              // Count statuses for building summary bar
              const normalCount = building.rooms.filter(r => r.status === 'normal').length
              const damagedCount = building.rooms.filter(r => r.status === 'damaged').length
              const criticalCount = building.rooms.filter(r => r.status === 'pending_replacement').length
              const total = building.total_rooms

              return (
                <div
                  key={building.id}
                  className={`relative rounded-2xl border p-4 transition-colors ${
                    hasRepairs
                      ? 'bg-orange-950/30 border-orange-500/30'
                      : 'bg-white/[0.04] border-white/[0.08]'
                  }`}
                >
                  {/* Building header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${
                        hasRepairs ? 'text-orange-200' : 'text-slate-200'
                      }`}>
                        {building.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                        {total} ห้อง
                      </p>
                    </div>
                    {hasRepairs && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        🔧 {buildingRepairs}
                      </span>
                    )}
                  </div>

                  {/* Mini status counts */}
                  {total > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      {normalCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          {normalCount}
                        </span>
                      )}
                      {damagedCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          {damagedCount}
                        </span>
                      )}
                      {criticalCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          {criticalCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Room dots */}
                  {!hasFloors ? (
                    <div className="flex flex-wrap gap-1.5">
                      {building.rooms.map((room) => (
                        <PublicRoomDot key={room.id} room={room} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {groupByFloor(building.rooms).map(([floor, rooms]) => (
                        <div key={floor ?? 'none'} className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-600 w-6 text-right shrink-0 tabular-nums">
                            {floor != null ? `${floor}F` : '—'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {rooms.map((room) => (
                              <PublicRoomDot key={room.id} room={room} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function PublicRoomDot({ room }: { room: RoomSummary }) {
  const [show, setShow] = useState(false)
  const dotColor = STATUS_COLOR[room.status] ?? 'bg-slate-600'
  const dotGlow = STATUS_GLOW[room.status] ?? ''
  const statusLabel = STATUS_LABEL[room.status] ?? 'ไม่ทราบ'
  const hasPending = room.pending_repairs > 0

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(v => !v)}
    >
      <span
        className={`block w-4 h-4 rounded-full cursor-default transition-transform hover:scale-125 ${dotColor} ${
          dotGlow ? `shadow-md ${dotGlow}` : ''
        } ${
          hasPending ? 'ring-2 ring-orange-500 ring-offset-[2px] ring-offset-slate-900' : ''
        }`}
      />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-slate-800 border border-white/10 text-white text-[11px] rounded-xl px-3 py-2 whitespace-nowrap shadow-2xl shadow-black/50">
            <p className="font-bold text-sm leading-tight text-white">{room.code}</p>
            <p className={`leading-tight mt-0.5 flex items-center gap-1.5 ${STATUS_TEXT_COLOR[room.status] ?? 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${STATUS_DOT_CLASS[room.status] ?? 'bg-slate-500'}`} />
              {statusLabel}
            </p>
            {hasPending && (
              <p className="text-orange-400 leading-tight mt-0.5">🔧 แจ้งซ่อม {room.pending_repairs} รายการ</p>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  )
}

