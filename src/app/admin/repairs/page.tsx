import { Navbar } from '@/components/shared/Navbar'
import { RepairRequest } from '@/types'
import { repairStatusLabel, repairStatusColor } from '@/lib/equipment'
import { RepairStatusUpdater } from './RepairStatusUpdater'

async function getRepairs(): Promise<RepairRequest[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/repairs`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function AdminRepairsPage() {
  const repairs = await getRepairs()

  const pending = repairs.filter((r) => r.status === 'pending')
  const inProgress = repairs.filter((r) => r.status === 'in_progress')
  const resolved = repairs.filter((r) => r.status === 'resolved' || r.status === 'closed')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ติดตามการแจ้งซ่อม</h1>
            <p className="text-sm text-gray-500 mt-1">รวม {repairs.length} รายการ</p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-orange-600 font-medium">รอดำเนินการ {pending.length}</span>
            <span className="text-blue-600 font-medium">กำลังซ่อม {inProgress.length}</span>
            <span className="text-green-600 font-medium">เสร็จแล้ว {resolved.length}</span>
          </div>
        </div>

        <div className="space-y-3">
          {repairs.length === 0 ? (
            <p className="text-center text-gray-400 py-12">ยังไม่มีรายการแจ้งซ่อม</p>
          ) : (
            repairs.map((r: any) => (
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
                    {r.resolved_note && (
                      <p className="text-sm text-green-700 bg-green-50 rounded p-2 mt-2">
                        📝 {r.resolved_note}
                      </p>
                    )}
                  </div>
                  <RepairStatusUpdater repairId={r.id} currentStatus={r.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
