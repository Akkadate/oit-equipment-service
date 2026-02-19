'use client'

import Link from 'next/link'
import { RoomSummary } from '@/types'

interface Props {
  room: RoomSummary
}

const statusConfig = {
  normal: {
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    ring: 'hover:ring-emerald-200',
    label: 'ปกติ',
  },
  damaged: {
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    ring: 'hover:ring-amber-200',
    label: 'ชำรุด',
  },
  pending_replacement: {
    bar: 'bg-red-500',
    dot: 'bg-red-500',
    ring: 'hover:ring-red-200',
    label: 'รอเปลี่ยน',
  },
  unchecked: {
    bar: 'bg-gray-300',
    dot: 'bg-gray-300',
    ring: 'hover:ring-gray-200',
    label: 'ยังไม่ตรวจ',
  },
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'วันนี้'
  if (diffDays === 1) return 'เมื่อวาน'
  if (diffDays < 7) return `${diffDays} วันก่อน`
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function RoomStatusCard({ room }: Props) {
  const cfg = statusConfig[room.status]

  return (
    <Link href={`/room/${room.id}`} className="block group">
      <div
        className={`relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden
          transition-all duration-150 hover:shadow-md hover:ring-2 hover:border-transparent
          active:scale-[0.96] ${cfg.ring}`}
        title={`${room.code} — ${cfg.label}`}
      >
        {/* Colored left accent bar */}
        <div className={`absolute left-0 inset-y-0 w-[3px] ${cfg.bar}`} />

        <div className="pl-3 pr-2.5 py-2.5">
          {/* Room code + status dot */}
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <span className="font-semibold text-[13px] text-gray-900 leading-tight tracking-tight">
              {room.code}
            </span>
          </div>
          {/* Last inspection date */}
          <p className="text-[10px] text-gray-400 mt-1 leading-none pl-3">
            {room.last_inspected_at ? shortDate(room.last_inspected_at) : 'ยังไม่ตรวจ'}
          </p>
        </div>
      </div>
    </Link>
  )
}
