import Link from 'next/link'
import { Navbar } from '@/components/shared/Navbar'
import { EquipmentManager } from './EquipmentManager'
import { internalUrl } from '@/lib/equipment'

export const dynamic = 'force-dynamic'

async function getEquipment() {
  const res = await fetch(internalUrl('/api/equipment'), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function getEquipmentTypes() {
  const { createServiceClient } = await import('@/lib/supabase')
  const supabase = createServiceClient()
  const { data } = await supabase.from('equipment_types').select('*').order('name')
  return data ?? []
}

async function getRooms() {
  const { createServiceClient } = await import('@/lib/supabase')
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('rooms')
    .select('id, code, name, building:buildings(code, name)')
    .order('code')
  return data ?? []
}

export default async function AdminEquipmentPage() {
  const [equipment, types, rooms] = await Promise.all([
    getEquipment(),
    getEquipmentTypes(),
    getRooms(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">จัดการอุปกรณ์</h1>
            <p className="text-sm text-gray-500 mt-1">รวม {equipment.length} รายการ</p>
          </div>
          <Link
            href="/admin/equipment/import"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M8 4l-4 4h2.5v4h3V8H12L8 4z"/>
              <path d="M2 13h12v1.5H2z"/>
            </svg>
            นำเข้า CSV
          </Link>
        </div>
        <EquipmentManager types={types} rooms={rooms} equipment={equipment} />
      </main>
    </div>
  )
}
