import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { Navbar } from '@/components/shared/Navbar'
import { InventoryClient } from './InventoryClient'
import type { InventoryRow } from './InventoryClient'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/login?next=/admin/reports/inventory')

  const db = createServiceClient()
  const { data, error } = await db.rpc('rpt_equipment_inventory')

  const rows = (data as InventoryRow[]) ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-5 pt-5 pb-16">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin/reports"
                className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >
                รายงาน
              </Link>
              <span className="text-xs text-gray-300">/</span>
              <span className="text-xs text-gray-600">ทะเบียนอุปกรณ์</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">ทะเบียนอุปกรณ์</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              อุปกรณ์ที่ใช้งานอยู่ทั้งหมด · เรียงตาม วิทยาเขต → อาคาร → ชั้น → ห้อง
              {error && <span className="text-red-400 ml-2">⚠ {error.message}</span>}
            </p>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <InventoryClient rows={rows} />
        </div>
      </main>
    </div>
  )
}
