import { Navbar } from '@/components/shared/Navbar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EquipmentManager } from './EquipmentManager'

async function getEquipment() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/equipment`, {
    cache: 'no-store',
  })
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">จัดการอุปกรณ์</h1>
            <p className="text-sm text-gray-500 mt-1">รวม {equipment.length} รายการ</p>
          </div>
          <EquipmentManager types={types} rooms={rooms} />
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ชื่ออุปกรณ์</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">รหัส</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Serial</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ติดตั้ง</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    ยังไม่มีอุปกรณ์
                  </td>
                </tr>
              ) : (
                equipment.map((eq: any) => (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{eq.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{eq.asset_code}</td>
                    <td className="px-4 py-3 text-gray-500">{eq.equipment_type?.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {eq.room?.building?.name} · {eq.room?.code}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {eq.serial_number ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {eq.installed_at
                        ? new Date(eq.installed_at).toLocaleDateString('th-TH')
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
