import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { Navbar } from '@/components/shared/Navbar'
import { ReportsTabs } from './ReportsTabs'
import type {
  ExecutiveSummary, StatusRow, PendingReplRow, NotInspectedRow,
  MonthlyRow, RoomRepairRow, EquipRepairRow, PendingRepairRow, HistoryRow,
  WeeklyInspectionRow,
} from './ReportsTabs'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login?next=/admin/reports')

  const db = createServiceClient()

  const [
    { data: summaryRaw },
    { data: statusRaw },
    { data: pendingReplRaw },
    { data: notInspectedRaw },
    { data: monthlyRaw },
    { data: roomRepairsRaw },
    { data: equipRepairsRaw },
    { data: pendingRepairsRaw },
    { data: historyRaw },
    { data: weeklyRaw },
  ] = await Promise.all([
    db.rpc('rpt_executive_summary'),
    db.rpc('rpt_equipment_status_summary'),
    db.rpc('rpt_equipment_pending_replacement'),
    db.rpc('rpt_rooms_not_inspected', { days_threshold: 30 }),
    db.rpc('rpt_repair_monthly'),
    db.rpc('rpt_rooms_most_repairs', { limit_count: 10 }),
    db.rpc('rpt_equipment_most_repairs', { limit_count: 10 }),
    db.rpc('rpt_repair_pending'),
    db.rpc('rpt_inspection_history', { limit_count: 30 }),
    db.rpc('rpt_weekly_inspection'),
  ])

  const summary = (summaryRaw as ExecutiveSummary) ?? ({} as ExecutiveSummary)
  const monthly = (monthlyRaw as MonthlyRow[]) ?? []

  // Fill monthly gaps (last 12 months)
  const last12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (11 - i))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const chartData = last12.map(
    (m) => monthly.find((r) => r.month === m) ?? { month: m, total: 0, pending: 0, in_progress: 0, resolved: 0, closed: 0 }
  )
  const chartMax = Math.max(...chartData.map((r) => r.total), 1)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 pt-5 pb-16">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-gray-900">รายงาน</h1>
            <p className="text-xs text-gray-400 mt-0.5">ข้อมูล ณ วันนี้ · ดึงจากฐานข้อมูลทั้งหมด ไม่จำกัดจำนวนแถว</p>
          </div>
          <Link
            href="/admin/reports/inventory"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h8v2H2z"/>
            </svg>
            ทะเบียนอุปกรณ์
          </Link>
        </div>

        <ReportsTabs
          summary={summary}
          statusRows={(statusRaw as StatusRow[]) ?? []}
          pendingRepl={(pendingReplRaw as PendingReplRow[]) ?? []}
          notInspected={(notInspectedRaw as NotInspectedRow[]) ?? []}
          chartData={chartData}
          chartMax={chartMax}
          roomRepairs={(roomRepairsRaw as RoomRepairRow[]) ?? []}
          equipRepairs={(equipRepairsRaw as EquipRepairRow[]) ?? []}
          pendingRepairs={(pendingRepairsRaw as PendingRepairRow[]) ?? []}
          history={(historyRaw as HistoryRow[]) ?? []}
          weeklyInspection={(weeklyRaw as WeeklyInspectionRow[]) ?? []}
        />
      </main>
    </div>
  )
}
