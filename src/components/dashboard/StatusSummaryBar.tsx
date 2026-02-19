'use client'

import { BuildingSummary } from '@/types'

interface Props {
  buildings: BuildingSummary[]
}

export function StatusSummaryBar({ buildings }: Props) {
  const totals = buildings.reduce(
    (acc, b) => ({
      normal: acc.normal + b.rooms_normal,
      damaged: acc.damaged + b.rooms_damaged,
      critical: acc.critical + b.rooms_critical,
      unchecked: acc.unchecked + b.rooms_unchecked,
    }),
    { normal: 0, damaged: 0, critical: 0, unchecked: 0 }
  )

  const total = totals.normal + totals.damaged + totals.critical + totals.unchecked

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <StatItem dot="🟢" label="ปกติ" count={totals.normal} total={total} color="text-green-700" />
      <StatItem dot="🟡" label="ชำรุด" count={totals.damaged} total={total} color="text-yellow-700" />
      <StatItem dot="🔴" label="รอเปลี่ยน" count={totals.critical} total={total} color="text-red-700" />
      <StatItem dot="⚪" label="ยังไม่ตรวจ" count={totals.unchecked} total={total} color="text-gray-500" />
      <span className="text-gray-400 self-center">รวม {total} ห้อง</span>
    </div>
  )
}

function StatItem({
  dot, label, count, total, color,
}: { dot: string; label: string; count: number; total: number; color: string }) {
  return (
    <span className={`flex items-center gap-1 font-medium ${color}`}>
      <span>{dot}</span>
      <span>{label}</span>
      <span className="font-bold">{count}</span>
      {total > 0 && (
        <span className="text-gray-400 font-normal text-xs">
          ({Math.round((count / total) * 100)}%)
        </span>
      )}
    </span>
  )
}
