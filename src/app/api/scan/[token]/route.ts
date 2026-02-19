import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: room, error } = await supabase
    .from('rooms')
    .select(`
      id, code, name, floor, qr_token,
      building:buildings (
        id, code, name,
        campus:campuses (
          id, code, name
        )
      ),
      equipment (
        id, name, asset_code, serial_number, note, installed_at,
        equipment_type:equipment_types ( id, name ),
        equipment_inspections (
          id, status, comment, inspected_at, inspected_by
        )
      )
    `)
    .eq('qr_token', token)
    .single()

  if (error || !room) {
    return NextResponse.json({ error: 'ไม่พบห้องนี้' }, { status: 404 })
  }

  // Attach latest inspection to each equipment
  const equipment = (room.equipment as any[]).map((eq) => {
    const sorted = [...eq.equipment_inspections].sort(
      (a: any, b: any) => new Date(b.inspected_at).getTime() - new Date(a.inspected_at).getTime()
    )
    const latest = sorted[0]
    return {
      ...eq,
      latest_status: latest?.status ?? null,
      latest_comment: latest?.comment ?? null,
      latest_inspected_at: latest?.inspected_at ?? null,
    }
  })

  return NextResponse.json({ ...room, equipment })
}
