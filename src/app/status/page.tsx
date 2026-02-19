import { CampusSummary } from '@/types'
import { internalUrl } from '@/lib/equipment'
import { PublicDotDashboard } from '@/components/dashboard/PublicDotDashboard'

export const dynamic = 'force-dynamic'

async function getDashboardData(): Promise<CampusSummary[]> {
  const res = await fetch(internalUrl('/api/dashboard'), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function StatusPage() {
  const campuses = await getDashboardData()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">สถานะห้องเรียน</h1>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
              สำนักเทคโนโลยีสารสนเทศ · มหาวิทยาลัยนอร์ทกรุงเทพ
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-5 pt-5">
        {campuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-400 text-sm">ยังไม่มีข้อมูลห้องเรียน</p>
          </div>
        ) : (
          <PublicDotDashboard initialCampuses={campuses} />
        )}
      </main>
    </div>
  )
}
