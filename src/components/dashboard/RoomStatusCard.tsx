'use client'

import Link from 'next/link'
import { RoomSummary } from '@/types'
import { statusDot, statusLabel, statusColor } from '@/lib/equipment'

interface Props {
  room: RoomSummary
}

export function RoomStatusCard({ room }: Props) {
  const dot = statusDot[room.status]
  const dotColor = statusColor[room.status]

  return (
    <Link href={`/room/${room.id}`} className="block">
      <div className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${dotColor}`}
              title={statusLabel[room.status]}
            />
            <div>
              <p className="font-medium text-sm text-gray-900">{room.code}</p>
              {room.name && (
                <p className="text-xs text-gray-500 line-clamp-1">{room.name}</p>
              )}
            </div>
          </div>
          <span className="text-lg">{dot}</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span>{room.equipment_count} รายการ</span>
          {room.pending_repairs > 0 && (
            <span className="text-orange-600 font-medium">
              รอซ่อม {room.pending_repairs}
            </span>
          )}
        </div>
        {room.last_inspected_at && (
          <p className="mt-1 text-xs text-gray-400">
            ตรวจล่าสุด:{' '}
            {new Date(room.last_inspected_at).toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              year: '2-digit',
            })}
          </p>
        )}
      </div>
    </Link>
  )
}
