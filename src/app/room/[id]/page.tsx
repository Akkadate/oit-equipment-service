import { Navbar } from '@/components/shared/Navbar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Equipment, RepairRequest } from '@/types'
import { repairStatusLabel, repairStatusColor, internalUrl } from '@/lib/equipment'

async function getEquipment(roomId: string): Promise<Equipment[]> {
  const res = await fetch(
    internalUrl(`/api/equipment?roomId=${roomId}`),
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  return res.json()
}

async function getRepairs(roomId: string): Promise<RepairRequest[]> {
  const res = await fetch(
    internalUrl(`/api/repairs?roomId=${roomId}`),
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  return res.json()
}

async function getInspections(roomId: string) {
  const res = await fetch(
    internalUrl(`/api/inspections?roomId=${roomId}`),
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  return res.json()
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [equipment, repairs, inspections] = await Promise.all([
    getEquipment(id),
    getRepairs(id),
    getInspections(id),
  ])

  const roomInfo = (equipment[0] as any)?.room

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>{roomInfo?.building?.campus?.name}</span>
            <span>/</span>
            <span>{roomInfo?.building?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            ห้อง {roomInfo?.code ?? id}
            {roomInfo?.name && (
              <span className="text-base font-normal text-gray-500 ml-2">
                — {roomInfo.name}
              </span>
            )}
          </h1>
        </div>

        {/* Equipment list */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            อุปกรณ์ทั้งหมด ({equipment.length} รายการ)
          </h2>
          {equipment.length === 0 ? (
            <p className="text-gray-400 text-sm">ยังไม่มีอุปกรณ์</p>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">ชื่ออุปกรณ์</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">รหัส</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">ประเภท</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">สถานะล่าสุด</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">ตรวจล่าสุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {equipment.map((eq: any) => (
                    <tr key={eq.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{eq.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{eq.asset_code}</td>
                      <td className="px-4 py-3 text-gray-500">{eq.equipment_type?.name}</td>
                      <td className="px-4 py-3">
                        {eq.latest_status ? (
                          <StatusBadge status={eq.latest_status} />
                        ) : (
                          <span className="text-gray-400 text-xs">ยังไม่ตรวจ</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {eq.latest_inspected_at
                          ? new Date(eq.latest_inspected_at).toLocaleDateString('th-TH')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Repair requests */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            รายการแจ้งซ่อม ({repairs.length} รายการ)
          </h2>
          {repairs.length === 0 ? (
            <p className="text-gray-400 text-sm">ไม่มีรายการแจ้งซ่อม</p>
          ) : (
            <div className="space-y-2">
              {repairs.map((r: any) => (
                <div key={r.id} className="bg-white border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">{r.equipment?.name}</p>
                      <p className="text-gray-600 text-sm mt-1">{r.description}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        โดย {r.reported_by}
                        {r.reporter_phone && ` · ${r.reporter_phone}`}
                        {' · '}
                        {new Date(r.created_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${repairStatusColor[r.status]}`}
                    >
                      {repairStatusLabel[r.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Inspection history */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            ประวัติการตรวจสอบ
          </h2>
          {inspections.length === 0 ? (
            <p className="text-gray-400 text-sm">ยังไม่มีประวัติ</p>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">อุปกรณ์</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">สถานะ</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">หมายเหตุ / รูป</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">วันที่ตรวจ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inspections.slice(0, 50).map((ins: any) => (
                    <tr key={ins.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{ins.equipment?.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ins.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {ins.comment && <p>{ins.comment}</p>}
                        {ins.photo_url && (
                          <a href={ins.photo_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={ins.photo_url}
                              alt="รูปอุปกรณ์"
                              className="mt-1 h-16 w-16 object-cover rounded border hover:opacity-80 transition-opacity"
                            />
                          </a>
                        )}
                        {!ins.comment && !ins.photo_url && <span>-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(ins.inspected_at).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
