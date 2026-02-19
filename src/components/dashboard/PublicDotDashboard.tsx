'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CampusSummary, RoomSummary } from '@/types'
import { createClient } from '@/lib/supabase'

const POLL_INTERVAL = 30_000

const STATUS_COLOR: Record<string, string> = {
  normal: 'bg-emerald-500',
  damaged: 'bg-amber-500',
  pending_replacement: 'bg-red-500',
  unchecked: 'bg-gray-300',
}

const STATUS_LABEL: Record<string, string> = {
  normal: 'ปกติ',
  damaged: 'ชำรุด',
  pending_replacement: 'รอเปลี่ยน',
  unchecked: 'ยังไม่ตรวจ',
}

interface Props {
  initialCampuses: CampusSummary[]
}

export function PublicDotDashboard({ initialCampuses }: Props) {
  const [campuses, setCampuses] = useState<CampusSummary[]>(initialCampuses)
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

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}
          title={live ? 'รับข้อมูลแบบ real-time' : 'polling ทุก 30 วินาที'}
        />
        <span className="text-[10px] text-gray-400">{live ? 'live' : 'auto'}</span>
      </div>

      {/* Campus sections */}
      {campuses.map((campus) => (
        <section key={campus.id}>
          <div className="flex items-center gap-2 mb-3">
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
                  className={`rounded-xl border px-3 py-2.5 ${
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

                  <div className="flex flex-wrap gap-1">
                    {building.rooms.map((room) => (
                      <PublicRoomDot key={room.id} room={room} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap pt-1 pb-4">
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
  )
}

function PublicRoomDot({ room }: { room: RoomSummary }) {
  const [show, setShow] = useState(false)
  const dotColor = STATUS_COLOR[room.status] ?? 'bg-gray-300'
  const statusLabel = STATUS_LABEL[room.status] ?? 'ไม่ทราบ'

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className={`block w-3.5 h-3.5 rounded-full cursor-default ${dotColor} ${
          room.pending_repairs > 0 ? 'ring-2 ring-orange-500 ring-offset-[1.5px]' : ''
        }`}
      />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none">
          <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
            <p className="font-semibold leading-tight">{room.code}</p>
            <p className="text-gray-300 leading-tight">{statusLabel}</p>
            {room.pending_repairs > 0 && (
              <p className="text-orange-300 leading-tight">แจ้งซ่อม {room.pending_repairs} รายการ</p>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
