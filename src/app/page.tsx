import { Navbar } from '@/components/shared/Navbar'
import { RoomStatusCard } from '@/components/dashboard/RoomStatusCard'
import { StatusSummaryBar } from '@/components/dashboard/StatusSummaryBar'
import { CampusSummary } from '@/types'
import { internalUrl } from '@/lib/equipment'

async function getDashboardData(): Promise<CampusSummary[]> {
  const res = await fetch(internalUrl('/api/dashboard'), {
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function DashboardPage() {
  const campuses = await getDashboardData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            Dashboard สถานะห้องเรียน
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            สำนักเทคโนโลยีสารสนเทศ มหาวิทยาลัยนอร์ทกรุงเทพ
          </p>
        </div>

        {campuses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            ยังไม่มีข้อมูลวิทยาเขต
          </div>
        ) : (
          campuses.map((campus) => (
            <div key={campus.id} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-800">
                  {campus.name}
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {campus.code}
                </span>
              </div>

              <StatusSummaryBar buildings={campus.buildings} />

              <div className="mt-4 space-y-6">
                {campus.buildings.map((building) => (
                  <div key={building.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium text-gray-700">
                        {building.name}
                      </h3>
                      <span className="text-xs text-gray-400">
                        ({building.total_rooms} ห้อง)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {building.rooms.map((room) => (
                        <RoomStatusCard key={room.id} room={room} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
