import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { calcRoomStatus } from '@/lib/equipment'
import { EquipmentStatus } from '@/types'

export async function GET() {
  const supabase = createServiceClient()

  const { data: campuses, error } = await supabase
    .from('campuses')
    .select(`
      id, code, name,
      buildings (
        id, code, name,
        rooms (
          id, code, name, floor, qr_token, created_at,
          equipment (
            id,
            equipment_inspections (
              status, inspected_at
            )
          ),
          repair_requests (
            id, status
          )
        )
      )
    `)
    .order('sort_order')
    .order('code')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute room status from latest inspection per equipment
  const result = campuses?.map((campus: any) => ({
    ...campus,
    buildings: campus.buildings.map((building: any) => {
      const rooms = building.rooms.map((room: any) => {
        const latestStatuses: EquipmentStatus[] = room.equipment.map((eq: any) => {
          const sorted = [...eq.equipment_inspections].sort(
            (a: any, b: any) => new Date(b.inspected_at).getTime() - new Date(a.inspected_at).getTime()
          )
          return sorted[0]?.status as EquipmentStatus | undefined
        }).filter(Boolean) as EquipmentStatus[]

        const allInspections = room.equipment.flatMap((eq: any) => eq.equipment_inspections)
        const lastInspected = allInspections
          .sort((a: any, b: any) => new Date(b.inspected_at).getTime() - new Date(a.inspected_at).getTime())[0]

        const pendingRepairs = room.repair_requests.filter(
          (r: any) => r.status === 'pending' || r.status === 'in_progress'
        ).length

        return {
          id: room.id,
          code: room.code,
          name: room.name,
          floor: room.floor,
          qr_token: room.qr_token,
          status: calcRoomStatus(latestStatuses),
          last_inspected_at: lastInspected?.inspected_at ?? null,
          equipment_count: room.equipment.length,
          pending_repairs: pendingRepairs,
        }
      })

      const roomStatuses = rooms.map((r: any) => r.status)
      return {
        id: building.id,
        code: building.code,
        name: building.name,
        rooms,
        total_rooms: rooms.length,
        rooms_normal: roomStatuses.filter((s: string) => s === 'normal').length,
        rooms_damaged: roomStatuses.filter((s: string) => s === 'damaged').length,
        rooms_critical: roomStatuses.filter((s: string) => s === 'pending_replacement').length,
        rooms_unchecked: roomStatuses.filter((s: string) => s === 'unchecked').length,
      }
    }),
  }))

  return NextResponse.json(result)
}
