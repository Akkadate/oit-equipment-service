import { Navbar } from '@/components/shared/Navbar'
import { internalUrl } from '@/lib/equipment'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getStats() {
  const res = await fetch(internalUrl('/api/stats'), { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

const REPAIR_STATUS: Record<string, { label: string; color: string }> = {
  pending:     { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'กำลังซ่อม',  color: 'bg-blue-100 text-blue-800' },
  resolved:    { label: 'ซ่อมแล้ว',    color: 'bg-green-100 text-green-800' },
  closed:      { label: 'ปิด',          color: 'bg-gray-100 text-gray-600' },
}

export default async function StatsPage() {
  const data = await getStats()

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 pt-8 pb-20">
          <p className="text-gray-400 text-center py-20">ไม่สามารถโหลดข้อมูลได้</p>
        </main>
      </div>
    )
  }

  const { totalEquipment, activeEquipment, totalRooms, pendingRepairs, rooms, typeStats, recentRepairs } = data
  const retiredEquipment = totalEquipment - activeEquipment

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-3 sm:px-5 pb-20 pt-5">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900">สรุปภาพรวมระบบ</h1>
          <p className="text-xs text-gray-400 mt-0.5">ข้อมูล ณ ปัจจุบัน · อัปเดตทุกครั้งที่โหลดหน้า</p>
        </div>

        {/* Primary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon="📦"
            label="อุปกรณ์ทั้งหมด"
            value={activeEquipment}
            sub={retiredEquipment > 0 ? `จำหน่ายแล้ว ${retiredEquipment} ชิ้น` : undefined}
            color="blue"
          />
          <StatCard
            icon="🚪"
            label="ห้องเรียนทั้งหมด"
            value={totalRooms}
            color="indigo"
          />
          <StatCard
            icon="🔧"
            label="รอดำเนินการซ่อม"
            value={pendingRepairs}
            color={pendingRepairs > 0 ? 'orange' : 'green'}
            href="/admin/repairs"
          />
          <StatCard
            icon="✅"
            label="ห้องสถานะปกติ"
            value={rooms.normal}
            sub={`จาก ${totalRooms} ห้อง`}
            color="green"
          />
        </div>

        {/* Room status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">สถานะห้องเรียน</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <RoomStatusItem
              color="bg-emerald-500"
              label="ปกติ"
              count={rooms.normal}
              total={totalRooms}
            />
            <RoomStatusItem
              color="bg-amber-500"
              label="มีอุปกรณ์ชำรุด"
              count={rooms.damaged}
              total={totalRooms}
            />
            <RoomStatusItem
              color="bg-red-500"
              label="รอเปลี่ยนอุปกรณ์"
              count={rooms.critical}
              total={totalRooms}
            />
            <RoomStatusItem
              color="bg-gray-300"
              label="ยังไม่ตรวจสอบ"
              count={rooms.unchecked}
              total={totalRooms}
            />
          </div>

          {/* Progress bar */}
          {totalRooms > 0 && (
            <div className="mt-4 h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
              <div className="bg-emerald-500 transition-all" style={{ width: `${(rooms.normal / totalRooms) * 100}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${(rooms.damaged / totalRooms) * 100}%` }} />
              <div className="bg-red-500 transition-all" style={{ width: `${(rooms.critical / totalRooms) * 100}%` }} />
              <div className="bg-gray-200 transition-all" style={{ width: `${(rooms.unchecked / totalRooms) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Equipment by type */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">อุปกรณ์ตามประเภท</h2>
            {typeStats.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">ไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2.5">
                {typeStats.map((t: any) => (
                  <div key={t.name}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-700">{t.name}</span>
                      <span className="font-semibold text-gray-900 tabular-nums">{t.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(t.count / activeEquipment) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent pending repairs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">การแจ้งซ่อมที่รอดำเนินการ</h2>
              <Link href="/admin/repairs" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
            </div>
            {recentRepairs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm text-gray-500">ไม่มีรายการที่รอดำเนินการ</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRepairs.map((r: any) => {
                  const st = REPAIR_STATUS[r.status] ?? { label: r.status, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={r.id} className="flex gap-3 items-start">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap mt-0.5 ${st.color}`}>
                        {st.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{r.equipment?.name ?? '-'}</p>
                        <p className="text-[11px] text-gray-400 truncate">{r.room?.code} · {r.room?.building?.name}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon, label, value, sub, color, href,
}: {
  icon: string
  label: string
  value: number
  sub?: string
  color: 'blue' | 'indigo' | 'green' | 'orange'
  href?: string
}) {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  const card = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-lg mb-3 ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1.5 leading-snug">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
  if (href) return <Link href={href}>{card}</Link>
  return card
}

function RoomStatusItem({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
        <p className="text-sm font-semibold text-gray-900 tabular-nums">{count} <span className="text-xs font-normal text-gray-400">({pct}%)</span></p>
      </div>
    </div>
  )
}
