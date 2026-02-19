'use client'

import { RoomStatus, EquipmentStatus } from '@/types'
import { statusLabel, statusBadgeVariant, statusDot } from '@/lib/equipment'

interface Props {
  status: RoomStatus | EquipmentStatus
  showDot?: boolean
}

export function StatusBadge({ status, showDot = false }: Props) {
  const colorClass = statusBadgeVariant[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {showDot && <span>{statusDot[status as RoomStatus] ?? '⚪'}</span>}
      {statusLabel[status]}
    </span>
  )
}
