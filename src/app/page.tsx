import { Navbar } from '@/components/shared/Navbar'
import { RoomStatusCard } from '@/components/dashboard/RoomStatusCard'
import { StatusSummaryBar } from '@/components/dashboard/StatusSummaryBar'
import { CampusSummary } from '@/types'
import { internalUrl } from '@/lib/equipment'

export const dynamic = 'force-dynamic'

async function getDashboardData(): Promise<CampusSummary[]> {
  const res = await fetch(internalUrl('/api/dashboard'), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function DashboardPage() {
  const campuses = await getDashboardData()
  const totalRooms = campuses.flatMap((c) => c.buildings).reduce((s, b) => s + b.total_rooms, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-5 pb-20 pt-5">

        {/* Page header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              ภาพรวมสถานะห้องเรียน
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              สำนักเทคโนโลยีสารสนเทศ · มหาวิทยาลัยนอร์ทกรุงเทพ
            </p>
          </div>
          {totalRooms > 0 && (
            <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm whitespace-nowrap">
              {totalRooms} ห้อง
            </span>
          )}
        </div>

        {campuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <span className="text-3xl">🏫</span>
            </div>
            <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลห้องเรียน</p>
            <p className="text-xs text-gray-400 mt-1">
              เพิ่มวิทยาเขต อาคาร และห้องเรียนได้ที่เมนูจัดการ
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {campuses.map((campus) => (
              <section key={campus.id}>

                {/* Campus header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-1 h-5 bg-blue-600 rounded-full flex-shrink-0" />
                  <h2 className="font-semibold text-gray-800 text-base leading-none">
                    {campus.name}
                  </h2>
                  <span className="text-[11px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {campus.code}
                  </span>
                </div>

                {/* Summary pills */}
                <div className="mb-4">
                  <StatusSummaryBar buildings={campus.buildings} />
                </div>

                {/* Buildings */}
                <div className="space-y-5">
                  {campus.buildings.map((building) => (
                    <div key={building.id}>

                      {/* Building divider label */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                          {building.name}
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] text-gray-300 whitespace-nowrap">
                          {building.total_rooms} ห้อง
                        </span>
                      </div>

                      {/* Compact room card grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-1.5">
                        {building.rooms.map((room) => (
                          <RoomStatusCard key={room.id} room={room} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </section>
            ))}
          </div>
        )}
      </main>

      {/* Mobile legend bar (sticky bottom) */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-4 py-2.5 flex items-center justify-center gap-5 sm:hidden">
        <LegendItem color="bg-emerald-500" label="ปกติ" />
        <LegendItem color="bg-amber-500" label="ชำรุด" />
        <LegendItem color="bg-red-500" label="รอเปลี่ยน" />
        <LegendItem color="bg-gray-300" label="ยังไม่ตรวจ" />
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}
