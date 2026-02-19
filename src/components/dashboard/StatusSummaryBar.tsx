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
    <div className="flex flex-wrap items-center gap-2">
      <Pill dot="bg-emerald-500" label="ปกติ" count={totals.normal} total={total}
        className="bg-emerald-50 text-emerald-700 border-emerald-200" />
      <Pill dot="bg-amber-500" label="ชำรุด" count={totals.damaged} total={total}
        className="bg-amber-50 text-amber-700 border-amber-200" />
      <Pill dot="bg-red-500" label="รอเปลี่ยน" count={totals.critical} total={total}
        className="bg-red-50 text-red-700 border-red-200" />
      <Pill dot="bg-gray-300" label="ยังไม่ตรวจ" count={totals.unchecked} total={total}
        className="bg-gray-50 text-gray-500 border-gray-200" />
      <span className="text-xs text-gray-400 ml-1">/ {total} ห้อง</span>
    </div>
  )
}

function Pill({
  dot, label, count, total, className,
}: {
  dot: string
  label: string
  count: number
  total: number
  className: string
}) {
  if (count === 0) return null
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
      <span className="font-bold">{count}</span>
      <span className="opacity-60 font-normal">{pct}%</span>
    </span>
  )
}
