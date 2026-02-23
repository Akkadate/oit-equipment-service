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

// Glow shadow for non-normal statuses
const STATUS_SHADOW: Record<string, string> = {
  damaged: 'shadow-sm shadow-amber-500/50',
  pending_replacement: 'shadow-sm shadow-red-500/50',
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
    <div className="space-y-4">
      {/* Live indicator — minimal top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            {live && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${live ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          </span>
          <span className={`text-[10px] font-medium ${live ? 'text-emerald-500' : 'text-slate-600'}`}>
            {live ? 'Live · อัปเดตอัตโนมัติ' : 'polling'}
          </span>
        </div>
        <span className="text-[10px] text-slate-600 tabular-nums">อัปเดตล่าสุด {timeStr}</span>
      </div>

      {/* Campus sections */}
      {campuses.map((campus) => (
        <section key={campus.id} className="space-y-2.5">
          {/* Campus divider label */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/[0.06]" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">
              {campus.name}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/[0.06]" />
          </div>

          {/* Building grid — dense multi-column */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
            {campus.buildings.map((building) => {
              const buildingRepairs = building.rooms.reduce(
                (sum, r) => sum + (r.pending_repairs ?? 0), 0
              )
              const hasRepairs = buildingRepairs > 0
              const hasFloors = building.rooms.some((r) => r.floor != null)
              const total = building.total_rooms
              const criticalCount = building.rooms.filter(r => r.status === 'pending_replacement').length
              const damagedCount = building.rooms.filter(r => r.status === 'damaged').length
              const normalCount = building.rooms.filter(r => r.status === 'normal').length

              return (
                <div
                  key={building.id}
                  className={`relative rounded-2xl border p-3 transition-colors ${
                    criticalCount > 0
                      ? 'bg-red-950/20 border-red-500/20'
                      : hasRepairs
                        ? 'bg-orange-950/20 border-orange-500/20'
                        : damagedCount > 0
                          ? 'bg-amber-950/15 border-amber-500/15'
                          : 'bg-white/[0.03] border-white/[0.07]'
                  }`}
                >
                  {/* Building header */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <p className={`text-xs font-semibold truncate leading-tight ${
                      criticalCount > 0 ? 'text-red-300'
                      : hasRepairs ? 'text-orange-300'
                      : damagedCount > 0 ? 'text-amber-300'
                      : 'text-slate-300'
                    }`}>
                      {building.name}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      {hasRepairs && (
                        <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none tabular-nums">
                          🔧{buildingRepairs}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status summary mini-row */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {normalCount > 0 && (
                      <span className="text-[9px] text-emerald-500 font-semibold tabular-nums flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {normalCount}
                      </span>
                    )}
                    {damagedCount > 0 && (
                      <span className="text-[9px] text-amber-500 font-semibold tabular-nums flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        {damagedCount}
                      </span>
                    )}
                    {criticalCount > 0 && (
                      <span className="text-[9px] text-red-500 font-semibold tabular-nums flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        {criticalCount}
                      </span>
                    )}
                    <span className="ml-auto text-[9px] text-slate-700 tabular-nums">{total}</span>
                  </div>

                  {/* Room dots */}
                  {!hasFloors ? (
                    <div className="flex flex-wrap gap-1">
                      {building.rooms.map((room) => (
                        <PublicRoomDot key={room.id} room={room} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {groupByFloor(building.rooms).map(([floor, rooms]) => (
                        <div key={floor ?? 'none'} className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-slate-700 w-4 text-right shrink-0 tabular-nums">
                            {floor != null ? `${floor}F` : '—'}
                          </span>
                          <div className="flex flex-wrap gap-1">
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
  const dotShadow = STATUS_SHADOW[room.status] ?? ''
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
        className={`block w-3 h-3 rounded-full cursor-default transition-transform hover:scale-150 ${dotColor} ${dotShadow} ${
          hasPending
            ? 'ring-2 ring-orange-500 ring-offset-[1.5px] ring-offset-slate-950'
            : ''
        }`}
      />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-slate-800/95 backdrop-blur-sm border border-white/10 text-white text-[11px] rounded-xl px-3 py-2 whitespace-nowrap shadow-2xl shadow-black/60">
            <p className="font-bold text-sm leading-tight">{room.code}</p>
            {room.name && (
              <p className="text-slate-400 text-[10px] leading-tight mt-0.5">{room.name}</p>
            )}
            <p className={`leading-tight mt-1 flex items-center gap-1.5 ${STATUS_TEXT_COLOR[room.status] ?? 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT_CLASS[room.status] ?? 'bg-slate-500'}`} />
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
