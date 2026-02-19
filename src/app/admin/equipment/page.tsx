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
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">จัดการอุปกรณ์</h1>
          <p className="text-sm text-gray-500 mt-1">รวม {equipment.length} รายการ</p>
        </div>
        <EquipmentManager types={types} rooms={rooms} equipment={equipment} />
      </main>
    </div>
  )
}
