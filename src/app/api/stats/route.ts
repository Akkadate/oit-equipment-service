import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()

  const [
    { count: totalEquipment },
    { count: activeEquipment },
    { count: totalRooms },
    { count: pendingRepairs },
    { data: typeBreakdown },
    { data: recentRepairs },
    { data: roomStatuses },
  ] = await Promise.all([
    supabase.from('equipment').select('*', { count: 'exact', head: true }),
    supabase.from('equipment').select('*', { count: 'exact', head: true }).is('retired_at', null),
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase
      .from('repair_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']),
    supabase
      .from('equipment')
      .select('equipment_types(name)')
      .is('retired_at', null),
    supabase
      .from('repair_requests')
      .select(`
        id, description, status, created_at,
        equipment:equipment(name, asset_code),
        room:rooms(code, building:buildings(name))
      `)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('rooms')
      .select(`
        id,
        equipment(
          id,
          equipment_inspections(status, inspected_at)
        )
      `),
  ])

  // Calculate room status breakdown
  let roomsNormal = 0, roomsDamaged = 0, roomsCritical = 0, roomsUnchecked = 0
  for (const room of (roomStatuses ?? []) as any[]) {
    const eqs: any[] = room.equipment ?? []
    if (eqs.length === 0) { roomsUnchecked++; continue }
    const latestStatuses = eqs.map((eq: any) => {
      const sorted = [...(eq.equipment_inspections ?? [])].sort(
        (a: any, b: any) => new Date(b.inspected_at).getTime() - new Date(a.inspected_at).getTime()
      )
      return sorted[0]?.status
    }).filter(Boolean)
    if (latestStatuses.length === 0) { roomsUnchecked++; continue }
    if (latestStatuses.includes('pending_replacement')) roomsCritical++
    else if (latestStatuses.includes('damaged')) roomsDamaged++
    else roomsNormal++
  }

  // Equipment type breakdown
  const typeMap: Record<string, number> = {}
  for (const eq of (typeBreakdown ?? []) as any[]) {
    const name = eq.equipment_types?.name ?? 'ไม่ระบุ'
    typeMap[name] = (typeMap[name] ?? 0) + 1
  }
  const typeStats = Object.entries(typeMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    totalEquipment: totalEquipment ?? 0,
    activeEquipment: activeEquipment ?? 0,
    totalRooms: totalRooms ?? 0,
    pendingRepairs: pendingRepairs ?? 0,
    rooms: { normal: roomsNormal, damaged: roomsDamaged, critical: roomsCritical, unchecked: roomsUnchecked },
    typeStats,
    recentRepairs: recentRepairs ?? [],
  })
}
