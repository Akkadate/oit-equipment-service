'use client'

import { useState } from 'react'
import { RepairRequest, RepairStatus } from '@/types'
import { repairStatusLabel, repairStatusColor } from '@/lib/equipment'
import { RepairStatusUpdater } from './RepairStatusUpdater'

interface Props {
  repairs: RepairRequest[]
}

type Tab = 'pending' | 'in_progress' | 'done'

const TAB_CONFIG: { id: Tab; label: string; statuses: RepairStatus[]; activeClass: string; countClass: string }[] = [
  {
    id: 'pending',
    label: 'รอดำเนินการ',
    statuses: ['pending'],
    activeClass: 'bg-orange-600 text-white border-orange-600',
    countClass: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'in_progress',
    label: 'กำลังซ่อม',
    statuses: ['in_progress'],
    activeClass: 'bg-blue-600 text-white border-blue-600',
    countClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'done',
    label: 'เสร็จแล้ว',
    statuses: ['resolved', 'closed'],
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
    countClass: 'bg-emerald-100 text-emerald-700',
  },
]

export function RepairsList({ repairs }: Props) {
  const [tab, setTab] = useState<Tab>('pending')

  const counts: Record<Tab, number> = {
    pending: repairs.filter((r) => r.status === 'pending').length,
    in_progress: repairs.filter((r) => r.status === 'in_progress').length,
    done: repairs.filter((r) => r.status === 'resolved' || r.status === 'closed').length,
  }

  const activeStatuses = TAB_CONFIG.find((t) => t.id === tab)!.statuses
  const shown = repairs.filter((r) => activeStatuses.includes(r.status))

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TAB_CONFIG.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              tab === t.id
                ? t.activeClass + ' shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === t.id ? 'bg-white/25 text-inherit' : t.countClass
              }`}
            >
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {shown.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border">
            ไม่มีรายการในหมวดนี้
          </div>
        ) : (
          shown.map((r: any) => (
            <div key={r.id} className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${repairStatusColor[r.status]}`}
                    >
                      {repairStatusLabel[r.status]}
                    </span>
                    <span className="text-sm text-gray-500">
                      {r.room?.building?.name} · ห้อง {r.room?.code}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 mt-2">{r.equipment?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    แจ้งโดย {r.reported_by}
                    {r.reporter_phone && ` · ${r.reporter_phone}`}
                    {' · '}
                    {new Date(r.created_at).toLocaleString('th-TH')}
                  </p>
                  {r.photo_url && (
                    <a href={r.photo_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                      <img
                        src={r.photo_url}
                        alt="รูปอุปกรณ์"
                        className="h-24 w-24 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                  {(r.resolved_note || r.resolved_by) && (
                    <div className="bg-green-50 rounded-lg p-2 mt-2 space-y-0.5">
                      {r.resolved_by && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ ดำเนินการโดย {r.resolved_by}
                        </p>
                      )}
                      {r.resolved_note && (
                        <p className="text-sm text-green-700">📝 {r.resolved_note}</p>
                      )}
                    </div>
                  )}
                </div>
                <RepairStatusUpdater repairId={r.id} currentStatus={r.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
