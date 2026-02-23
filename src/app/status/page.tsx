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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">

      {/* Hero header */}
      <header className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -top-10 right-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          {/* Logo + org */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <span className="text-white font-extrabold text-sm tracking-tight">OIT</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-300 tracking-wider uppercase">
                สำนักเทคโนโลยีสารสนเทศ
              </p>
              <p className="text-[11px] text-slate-400">มหาวิทยาลัยนอร์ทกรุงเทพ</p>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
            สถานะห้องเรียน
          </h1>
          <p className="text-slate-400 text-sm">
            ตรวจสอบความพร้อมของอุปกรณ์ในห้องเรียนแบบ real-time
          </p>

          {/* Stats pills */}
          {totalRooms > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              <StatPill icon="🚪" value={totalRooms} label="ห้องทั้งหมด" color="bg-white/10 text-white" />
              {totalRepairs > 0 && (
                <StatPill icon="🔧" value={totalRepairs} label="รอดำเนินการซ่อม" color="bg-orange-500/20 text-orange-300 border border-orange-500/30" />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 pb-24">
        {campuses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <span className="text-3xl">🏫</span>
            </div>
            <p className="text-slate-400 font-medium">ยังไม่มีข้อมูลห้องเรียน</p>
          </div>
        ) : (
          <PublicDotDashboard initialCampuses={campuses} />
        )}
      </main>

      {/* Sticky legend bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-slate-950/90 backdrop-blur-md border-t border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {[
              { color: 'bg-emerald-500', label: 'ปกติ' },
              { color: 'bg-amber-500', label: 'ชำรุด' },
              { color: 'bg-red-500', label: 'รอเปลี่ยน' },
              { color: 'bg-slate-600', label: 'ยังไม่ตรวจ' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm`} />
                {label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-orange-500 ring-offset-[1.5px] ring-offset-slate-950" />
              แจ้งซ่อมค้าง
            </span>
          </div>
          <span className="text-[10px] text-slate-600">OIT AssetLink · NBU</span>
        </div>
      </div>
    </div>
  )
}

function StatPill({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
      <span>{icon}</span>
      <span className="font-bold tabular-nums">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}
