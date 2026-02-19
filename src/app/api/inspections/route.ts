import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const supabase = createServiceClient()

  let query = supabase
    .from('equipment_inspections')
    .select(`
      id, status, comment, photo_url, inspected_at, inspected_by,
      equipment:equipment ( id, name, asset_code )
    `)
    .order('inspected_at', { ascending: false })
    .limit(200)

  if (roomId) query = query.eq('room_id', roomId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { room_id, inspections } = body

  if (!room_id || !Array.isArray(inspections) || inspections.length === 0) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'กรุณา login ก่อน' }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const rows = inspections.map((item: any) => ({
    equipment_id: item.equipment_id,
    room_id,
    inspected_by: user.id,
    status: item.status,
    comment: item.comment ?? null,
    photo_url: item.photo_url ?? null,
  }))

  const { data, error } = await serviceClient
    .from('equipment_inspections')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
