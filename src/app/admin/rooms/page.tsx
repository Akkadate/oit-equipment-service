import { Navbar } from '@/components/shared/Navbar'
import { QRCodeGenerator } from '@/components/qr/QRCodeGenerator'
import { internalUrl } from '@/lib/equipment'

async function getRooms() {
  const res = await fetch(internalUrl('/api/equipment'), {
    cache: 'no-store',
  })
  // Use dashboard data to get rooms
  const dashboard = await fetch(internalUrl('/api/dashboard'), {
    cache: 'no-store',
  })
  if (!dashboard.ok) return []
  const campuses = await dashboard.json()
  const rooms: any[] = []
  for (const campus of campuses) {
    for (const building of campus.buildings) {
      for (const room of building.rooms) {
        rooms.push({ ...room, building, campus })
      }
    }
  }
  return rooms
}

export default async function AdminRoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">จัดการห้องเรียน / QR Code</h1>
          <p className="text-sm text-gray-500 mt-1">รวม {rooms.length} ห้อง</p>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">อาคาร</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">วิทยาเขต</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">อุปกรณ์</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">QR Code</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rooms.map((room: any) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{room.code}</p>
                    {room.name && <p className="text-gray-400 text-xs">{room.name}</p>}
                    {room.floor && <p className="text-gray-400 text-xs">ชั้น {room.floor}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{room.building?.name ?? room.building?.code}</td>
                  <td className="px-4 py-3 text-gray-600">{room.campus?.name ?? room.campus?.code}</td>
                  <td className="px-4 py-3 text-gray-600">{room.equipment_count} รายการ</td>
                  <td className="px-4 py-3">
                    <QRCodeGenerator
                      roomId={room.id}
                      roomCode={room.code}
                      buildingName={room.building?.name ?? ''}
                      campusName={room.campus?.name ?? ''}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
