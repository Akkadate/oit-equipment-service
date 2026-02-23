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

      {/* Header — beautiful but compact */}
      <header className="flex-shrink-0 relative overflow-hidden border-b border-white/[0.06]">
        {/* Subtle glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-8 left-1/4 w-64 h-32 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="absolute -top-4 right-1/3 w-48 h-24 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Left: logo + title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-900/50 flex-shrink-0">
              <span className="text-white font-extrabold text-[10px] tracking-tight">OIT</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">สถานะห้องเรียน</h1>
              <p className="text-[10px] text-slate-500 leading-tight hidden sm:block">
                สำนักเทคโนโลยีสารสนเทศ · มหาวิทยาลัยนอร์ทกรุงเทพ
              </p>
            </div>
          </div>

          {/* Right: stats */}
          <div className="flex items-center gap-2">
            {totalRooms > 0 && (
              <span className="text-[11px] text-slate-400 bg-white/5 border border-white/[0.08] px-2.5 py-1 rounded-full tabular-nums">
                {totalRooms} ห้อง
              </span>
            )}
            {totalRepairs > 0 && (
              <span className="text-[11px] font-semibold text-orange-300 bg-orange-500/15 border border-orange-500/25 px-2.5 py-1 rounded-full tabular-nums">
                🔧 {totalRepairs} รอซ่อม
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-3 sm:px-4 pt-3 pb-12">
          {campuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <span className="text-3xl">🏫</span>
              </div>
              <p className="text-slate-400 text-sm">ยังไม่มีข้อมูลห้องเรียน</p>
            </div>
          ) : (
            <PublicDotDashboard initialCampuses={campuses} />
          )}
        </div>
      </main>

      {/* Slim legend bar */}
      <div className="flex-shrink-0 h-9 flex items-center justify-between px-4 sm:px-6 border-t border-white/[0.05] bg-slate-900/60 backdrop-blur-sm">
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
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-orange-500 ring-offset-[1.5px] ring-offset-slate-950" />
            แจ้งซ่อมค้าง
          </span>
        </div>
        <span className="text-[10px] text-slate-700">OIT AssetLink · NBU</span>
      </div>
    </div>
  )
}
