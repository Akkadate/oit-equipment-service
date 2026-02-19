import { Navbar } from '@/components/shared/Navbar'
import { internalUrl } from '@/lib/equipment'
import { RoomDetail } from './RoomDetail'

export const dynamic = 'force-dynamic'

async function getRoom(roomId: string) {
  const res = await fetch(internalUrl(`/api/rooms/${roomId}`), { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function getEquipment(roomId: string) {
  const res = await fetch(internalUrl(`/api/equipment?roomId=${roomId}`), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function getRepairs(roomId: string) {
  const res = await fetch(internalUrl(`/api/repairs?roomId=${roomId}`), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

async function getInspections(roomId: string) {
  const res = await fetch(internalUrl(`/api/inspections?roomId=${roomId}`), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [room, equipment, repairs, inspections] = await Promise.all([
    getRoom(id),
    getEquipment(id),
    getRepairs(id),
    getInspections(id),
  ])

  // Inspections are sorted DESC by inspected_at — first occurrence per equipment is the latest
  const latestInspMap = new Map<string, { status: string; inspected_at: string }>()
  for (const ins of inspections as any[]) {
    const eqId = ins.equipment?.id
    if (eqId && !latestInspMap.has(eqId)) {
      latestInspMap.set(eqId, { status: ins.status, inspected_at: ins.inspected_at })
    }
  }

  const enrichedEquipment = (equipment as any[]).map((eq) => ({
    ...eq,
    latest_status: latestInspMap.get(eq.id)?.status ?? null,
    latest_inspected_at: latestInspMap.get(eq.id)?.inspected_at ?? null,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>{room?.building?.campus?.name}</span>
            <span>/</span>
            <span>{room?.building?.name}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            ห้อง {room?.code ?? id}
            {room?.name && (
              <span className="text-base font-normal text-gray-500 ml-2">
                — {room.name}
              </span>
            )}
          </h1>
        </div>

        <RoomDetail
          equipment={enrichedEquipment}
          repairs={repairs as any[]}
          inspections={inspections as any[]}
        />
      </main>
    </div>
  )
}
