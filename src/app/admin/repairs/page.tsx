import { Navbar } from '@/components/shared/Navbar'
import { RepairRequest } from '@/types'
import { internalUrl } from '@/lib/equipment'
import { RepairsList } from './RepairsList'

export const dynamic = 'force-dynamic'

async function getRepairs(): Promise<RepairRequest[]> {
  const res = await fetch(internalUrl('/api/repairs'), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function AdminRepairsPage() {
  const repairs = await getRepairs()

  const pending = repairs.filter((r) => r.status === 'pending').length
  const inProgress = repairs.filter((r) => r.status === 'in_progress').length
  const done = repairs.filter((r) => r.status === 'resolved' || r.status === 'closed').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ติดตามการแจ้งซ่อม</h1>
            <p className="text-sm text-gray-500 mt-1">รวม {repairs.length} รายการ</p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-orange-600 font-medium">รอดำเนินการ {pending}</span>
            <span className="text-blue-600 font-medium">กำลังซ่อม {inProgress}</span>
            <span className="text-emerald-600 font-medium">เสร็จแล้ว {done}</span>
          </div>
        </div>

        <RepairsList repairs={repairs} />
      </main>
    </div>
  )
}
