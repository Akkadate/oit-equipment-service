import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const supabase = createServiceClient()

  let query = supabase
    .from('equipment')
    .select(`
      id, name, asset_code, serial_number, installed_at, note, created_at,
      equipment_type:equipment_types ( id, name ),
      room:rooms ( id, code, name, building:buildings ( id, code, name, campus:campuses ( id, code, name ) ) )
    `)
    .order('name')

  if (roomId) query = query.eq('room_id', roomId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { room_id, type_id, name, asset_code, serial_number, installed_at, note } = body

  if (!room_id || !type_id || !name || !asset_code) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('equipment')
    .insert({ room_id, type_id, name, asset_code, serial_number, installed_at, note })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
