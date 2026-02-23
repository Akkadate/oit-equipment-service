import { Navbar } from '@/components/shared/Navbar'
import { RoomManager } from './RoomManager'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function getData() {
  const supabase = createServiceClient()
  const [roomsRes, buildingsRes, eqRes] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, code, name, floor, sort_order, building:buildings(id, code, name, campus:campuses(id, code, name))')
      .order('code'),
    supabase
      .from('buildings')
      .select('*, campus:campuses(id, code, name)')
      .order('name'),
    supabase
      .from('equipment')
      .select('room_id')
      .is('retired_at', null),
  ])

  // นับอุปกรณ์ที่ยังใช้งานอยู่ต่อห้อง
  const countMap = new Map<string, number>()
  for (const eq of eqRes.data ?? []) {
    countMap.set(eq.room_id, (countMap.get(eq.room_id) ?? 0) + 1)
  }

  const rooms = (roomsRes.data ?? []).map((r: any) => ({
    ...r,
    equipment_count: countMap.get(r.id) ?? 0,
  }))

  return { rooms, buildings: buildingsRes.data ?? [] }
}

export default async function AdminRoomsPage() {
  const { rooms, buildings } = await getData()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">จัดการห้องเรียน / QR Code</h1>
          <p className="text-sm text-gray-500 mt-1">รวม {rooms.length} ห้อง</p>
        </div>
        <RoomManager rooms={rooms as any} buildings={buildings as any} />
      </main>
    </div>
  )
}
