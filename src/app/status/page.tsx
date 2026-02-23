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
  const totalRooms = campuses.flatMap((c) => c.buildings).reduce((s, b) => s + b.total_rooms, 0)
  const totalRepairs = campuses
    .flatMap((c) => c.buildings)
    .flatMap((b) => b.rooms)
    .reduce((s, r) => s + (r.pending_repairs ?? 0), 0)

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">

      {/* Slim header bar */}
      <header className="flex-shrink-0 h-11 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-extrabold text-[9px] tracking-tight">OIT</span>
          </div>
          <span className="font-semibold text-slate-200 text-sm">สถานะห้องเรียน</span>
          <span className="hidden sm:block text-[11px] text-slate-600">·</span>
          <span className="hidden sm:block text-[11px] text-slate-500">มหาวิทยาลัยนอร์ทกรุงเทพ</span>
        </div>

        <div className="flex items-center gap-3">
          {totalRooms > 0 && (
            <span className="text-[11px] text-slate-500 tabular-nums">{totalRooms} ห้อง</span>
          )}
          {totalRepairs > 0 && (
            <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full tabular-nums">
              🔧 {totalRepairs} รอซ่อม
            </span>
          )}
        </div>
      </header>

      {/* Main content — fills remaining height, scrollable on mobile only */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-3 sm:px-4 pt-3 pb-14">
          {campuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-slate-500 text-sm">ยังไม่มีข้อมูลห้องเรียน</p>
            </div>
          ) : (
            <PublicDotDashboard initialCampuses={campuses} />
          )}
        </div>
      </main>

      {/* Fixed legend bar */}
      <div className="flex-shrink-0 h-9 flex items-center justify-between px-4 sm:px-6 border-t border-white/[0.06] bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 flex-wrap">
          {[
            { color: 'bg-emerald-500', label: 'ปกติ' },
            { color: 'bg-amber-500', label: 'ชำรุด' },
            { color: 'bg-red-500', label: 'รอเปลี่ยน' },
            { color: 'bg-slate-600', label: 'ยังไม่ตรวจ' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-orange-500 ring-offset-[1.5px] ring-offset-slate-900" />
            แจ้งซ่อมค้าง
          </span>
        </div>
        <span className="text-[10px] text-slate-700">OIT AssetLink</span>
      </div>
    </div>
  )
}
