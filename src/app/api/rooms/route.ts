import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const buildingId = searchParams.get('buildingId')
  const campusId = searchParams.get('campusId')

  let query = supabase
    .from('rooms')
    .select('*, building:buildings(id, code, name, campus:campuses(id, code, name))')
    .order('sort_order')
    .order('code')

  if (buildingId) query = query.eq('building_id', buildingId)
  if (campusId) query = query.eq('buildings.campus_id', campusId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('rooms')
    .insert({
      building_id: body.buildingId,
      code: body.code,
      name: body.name || null,
      floor: body.floor ? Number(body.floor) : null,
      sort_order: body.sortOrder != null ? Number(body.sortOrder) : 99,
    })
    .select('*, building:buildings(id, code, name, campus:campuses(id, code, name))')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
